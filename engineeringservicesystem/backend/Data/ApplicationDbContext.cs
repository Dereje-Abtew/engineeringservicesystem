namespace backend.Data;

using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<EstimationRequest> EstimationRequests { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<EngineeringReport> EngineeringReports { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Branch> Branches { get; set; }
    public DbSet<FilteredEstimationAttachment> FilteredEstimationAttachments { get; set; }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder
            .Properties<DateTime>()
            .HaveConversion<DateTimeConverter>();
    }

    // Add this class at the bottom of your file or in a separate file
    public class DateTimeConverter : ValueConverter<DateTime, DateTime>
    {
        public DateTimeConverter() : base(
            v => v.ToUniversalTime(),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
        {
        }
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // User - Department Relationship
        builder.Entity<ApplicationUser>()
            .HasOne(u => u.UserDepartment)
            .WithMany(d => d.Users)
            .HasForeignKey(u => u.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        // User - Branch Relationship
        builder.Entity<ApplicationUser>()
            .HasOne(u => u.UserBranch)
            .WithMany(b => b.Users)
            .HasForeignKey(u => u.BranchId)
            .OnDelete(DeleteBehavior.SetNull);

        // Department - Branch Relationship
        builder.Entity<Branch>()
            .HasOne(b => b.Department)
            .WithMany(d => d.Branches)
            .HasForeignKey(b => b.DepartmentId);

        // One-to-One
        builder.Entity<EstimationRequest>()
            .HasOne(e => e.Report)
            .WithOne(r => r.EstimationRequest)
            .HasForeignKey<EngineeringReport>(r => r.EstimationRequestId);

        // One-to-Many
        builder.Entity<EstimationRequest>()
            .HasMany(e => e.Attachments)
            .WithOne(a => a.EstimationRequest)
            .HasForeignKey(a => a.EstimationRequestId);

        // FilteredEstimationAttachment relationships
        builder.Entity<FilteredEstimationAttachment>()
            .HasOne(f => f.EstimationRequest)
            .WithMany()
            .HasForeignKey(f => f.EstimationRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<FilteredEstimationAttachment>()
            .HasOne(f => f.Attachment)
            .WithMany()
            .HasForeignKey(f => f.AttachmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}