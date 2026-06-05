using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectFinanceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BillOfPenalty",
                table: "EstimationRequests",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectFinanceDocType",
                table: "EstimationRequests",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BillOfPenalty",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "ProjectFinanceDocType",
                table: "EstimationRequests");
        }
    }
}
