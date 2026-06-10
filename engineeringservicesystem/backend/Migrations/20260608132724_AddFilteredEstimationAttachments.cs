using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFilteredEstimationAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FilteredEstimationAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EstimationRequestId = table.Column<int>(type: "integer", nullable: false),
                    AttachmentId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FilteredEstimationAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FilteredEstimationAttachments_Attachments_AttachmentId",
                        column: x => x.AttachmentId,
                        principalTable: "Attachments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FilteredEstimationAttachments_EstimationRequests_EstimationRequestId",
                        column: x => x.EstimationRequestId,
                        principalTable: "EstimationRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FilteredEstimationAttachments_AttachmentId",
                table: "FilteredEstimationAttachments",
                column: "AttachmentId");

            migrationBuilder.CreateIndex(
                name: "IX_FilteredEstimationAttachments_EstimationRequestId",
                table: "FilteredEstimationAttachments",
                column: "EstimationRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FilteredEstimationAttachments");
        }
    }
}
