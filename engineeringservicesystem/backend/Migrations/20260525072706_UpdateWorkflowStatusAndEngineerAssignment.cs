using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateWorkflowStatusAndEngineerAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignedEngineerId",
                table: "EstimationRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EngineerAssignmentDate",
                table: "EstimationRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EstimationRequests_AssignedEngineerId",
                table: "EstimationRequests",
                column: "AssignedEngineerId");

            migrationBuilder.AddForeignKey(
                name: "FK_EstimationRequests_AspNetUsers_AssignedEngineerId",
                table: "EstimationRequests",
                column: "AssignedEngineerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EstimationRequests_AspNetUsers_AssignedEngineerId",
                table: "EstimationRequests");

            migrationBuilder.DropIndex(
                name: "IX_EstimationRequests_AssignedEngineerId",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "AssignedEngineerId",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "EngineerAssignmentDate",
                table: "EstimationRequests");
        }
    }
}
