using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStructureAndRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RejectionReason",
                table: "EstimationRequests",
                newName: "ManagerRejectionReason");

            migrationBuilder.RenameColumn(
                name: "ActionDescription",
                table: "EstimationRequests",
                newName: "ManagerActionDescription");

            migrationBuilder.RenameColumn(
                name: "ActionDate",
                table: "EstimationRequests",
                newName: "ManagerActionDate");

            migrationBuilder.AddColumn<DateTime>(
                name: "CheckerActionDate",
                table: "EstimationRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CheckerActionDescription",
                table: "EstimationRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CheckerRejectionReason",
                table: "EstimationRequests",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckerActionDate",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "CheckerActionDescription",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "CheckerRejectionReason",
                table: "EstimationRequests");

            migrationBuilder.RenameColumn(
                name: "ManagerRejectionReason",
                table: "EstimationRequests",
                newName: "RejectionReason");

            migrationBuilder.RenameColumn(
                name: "ManagerActionDescription",
                table: "EstimationRequests",
                newName: "ActionDescription");

            migrationBuilder.RenameColumn(
                name: "ManagerActionDate",
                table: "EstimationRequests",
                newName: "ActionDate");
        }
    }
}
