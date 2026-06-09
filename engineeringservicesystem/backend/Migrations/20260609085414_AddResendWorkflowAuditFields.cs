using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddResendWorkflowAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LastRejectionBy",
                table: "EstimationRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastRejectionDate",
                table: "EstimationRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastRejectionReason",
                table: "EstimationRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResendCount",
                table: "EstimationRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResentAt",
                table: "EstimationRequests",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastRejectionBy",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "LastRejectionDate",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "LastRejectionReason",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "ResendCount",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "ResentAt",
                table: "EstimationRequests");
        }
    }
}
