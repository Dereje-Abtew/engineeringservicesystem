using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using backend.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Fix JWT Claim Mapping
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // 1. Enables camelCase (e.g., checkerDescription maps to CheckerDescription)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        
        // 2. Prevents infinite loops in related data
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        
        // 3. Ignores null properties in responses
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Engineering Service System", Version = "v1" });
    
    // Add JWT Authentication to Swagger
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter JWT Bearer token **_only_**",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer", // must be lower case
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };
    c.AddSecurityDefinition(securityScheme.Reference.Id, securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {securityScheme, Array.Empty<string>()}
    });
});

// Configure Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyForDevelopmentOnlyPleaseChangeInProduction";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false; // set to true in production
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
    };
});

// Configure Permission-Based Authorization
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBranchesService, BranchesService>();
builder.Services.AddScoped<IEstimationRequestsService, EstimationRequestsService>();
builder.Services.AddScoped<IAttachmentsService, AttachmentsService>();
builder.Services.AddScoped<IReportsService, ReportsService>();
builder.Services.AddScoped<IDepartmentsService, DepartmentsService>();

// Configure CORS - explicitly allow any origin via SetIsOriginAllowed
// (compatible with AllowAnyHeader/AllowAnyMethod and safe for preflight).
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        b => b.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Engineering Service System v1"));
}

// IMPORTANT: HTTPS redirection must come AFTER CORS, and we skip it in
// development. Otherwise the browser preflight (OPTIONS) request gets
// redirected to HTTPS before CORS can respond, which produces:
// "Redirect is not allowed for a preflight request."
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles(); // Default wwwroot

// Serve the 'uploads' folder from project root
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseRouting();

// CORS must run BEFORE the rest of the pipeline so preflight OPTIONS
// requests are answered with the proper CORS headers (not redirected).
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed Default Roles and Admin
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();


    // Ensure DB exists and is migrated
    context.Database.Migrate();

    // Safety net: the migration that introduces FilteredEstimationAttachments
    // was originally a no-op, so on databases that recorded it as applied
    // without ever creating the table, the join in /EstimationRequests
    // throws "relation does not exist". Create the table idempotently here
    // so existing environments self-heal on next startup.
    context.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""FilteredEstimationAttachments"" (
            ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
            ""EstimationRequestId"" integer NOT NULL,
            ""AttachmentId"" integer NOT NULL,
            ""CreatedAt"" timestamp with time zone NOT NULL,
            ""CreatedBy"" text NULL,
            CONSTRAINT ""PK_FilteredEstimationAttachments"" PRIMARY KEY (""Id""),
            CONSTRAINT ""FK_FilteredEstimationAttachments_Attachments_AttachmentId""
                FOREIGN KEY (""AttachmentId"") REFERENCES ""Attachments""(""Id"") ON DELETE CASCADE,
            CONSTRAINT ""FK_FilteredEstimationAttachments_EstimationRequests_EstimationRequestId""
                FOREIGN KEY (""EstimationRequestId"") REFERENCES ""EstimationRequests""(""Id"") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS ""IX_FilteredEstimationAttachments_AttachmentId""
            ON ""FilteredEstimationAttachments"" (""AttachmentId"");
        CREATE INDEX IF NOT EXISTS ""IX_FilteredEstimationAttachments_EstimationRequestId""
            ON ""FilteredEstimationAttachments"" (""EstimationRequestId"");
    ");

    // Call user-defined seed data
    await SeedData.Initialize(context, userManager, roleManager);
}

app.Run();
