using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEstimationRequestFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TypeOfBuilding",
                table: "EstimationRequests",
                newName: "SubCity");

            migrationBuilder.RenameColumn(
                name: "Location",
                table: "EstimationRequests",
                newName: "LHUNo");

            migrationBuilder.AddColumn<int>(
                name: "BuildingType",
                table: "EstimationRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "EstimationRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Kebele",
                table: "EstimationRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "EstimationRequests",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "EstimationRequests",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BuildingType",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "City",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "Kebele",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "EstimationRequests");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "EstimationRequests");

            migrationBuilder.RenameColumn(
                name: "SubCity",
                table: "EstimationRequests",
                newName: "TypeOfBuilding");

            migrationBuilder.RenameColumn(
                name: "LHUNo",
                table: "EstimationRequests",
                newName: "Location");
        }
    }
}
