using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface IDepartmentsService
    {
        Task<IEnumerable<DepartmentResponseDto>> GetDepartmentsAsync();
        Task<Department?> GetDepartmentByIdAsync(Guid id);
        Task<Department> CreateDepartmentAsync(CreateDepartmentDto dto);
        Task<bool> UpdateDepartmentAsync(Guid id, UpdateDepartmentDto dto);
        Task<bool> DeleteDepartmentAsync(Guid id);
    }

    // --- Strongly Typed DTOs for Front-End/API Stability ---

    public class DepartmentResponseDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UsersCount { get; set; }
    }

    public class CreateDepartmentDto
    {
        public required string Name { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateDepartmentDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
}