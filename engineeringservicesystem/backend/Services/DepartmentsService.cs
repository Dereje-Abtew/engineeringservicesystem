using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Services
{
    public class DepartmentsService : IDepartmentsService
    {
        private readonly ApplicationDbContext _context;

        public DepartmentsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DepartmentResponseDto>> GetDepartmentsAsync()
        {
            return await _context.Departments
                .Include(d => d.Users)
                .Select(d => new DepartmentResponseDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    IsActive = d.IsActive,
                    CreatedAt = d.CreatedAt,
                    UsersCount = d.Users != null ? d.Users.Count : 0
                })
                .ToListAsync();
        }

        public async Task<Department?> GetDepartmentByIdAsync(Guid id)
        {
            return await _context.Departments
                .Include(d => d.Branches)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<Department> CreateDepartmentAsync(CreateDepartmentDto dto)
        {
            var department = new Department
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return department;
        }

        public async Task<bool> UpdateDepartmentAsync(Guid id, UpdateDepartmentDto dto)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return false;

            // Map update mutations safely onto tracked entity
            department.Name = dto.Name;
            department.Description = dto.Description;
            department.IsActive = dto.IsActive;

            _context.Entry(department).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteDepartmentAsync(Guid id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return false;

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}