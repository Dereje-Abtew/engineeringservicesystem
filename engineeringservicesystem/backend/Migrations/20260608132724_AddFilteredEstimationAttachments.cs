using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFilteredEstimationAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The FilteredEstimationAttachments table is already created in the database
            // (see image in the task description). This migration is a no-op so the
            // application can start up without trying to create a duplicate table.
            // It still gets recorded in the migrations history so EF Core knows the
            // model is in sync.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op: don't drop the existing table on rollback.
        }
    }
}
