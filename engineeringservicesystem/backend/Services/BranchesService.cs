using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Services
{
    public class BranchesService : IBranchesService
    {
        private readonly ApplicationDbContext _context;

        public BranchesService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<BranchResponseDto>> GetBranchesAsync()
        {
            return await _context.Branches
                .Select(b => new BranchResponseDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    BranchCode = b.BranchCode,
                    Location = b.Location,
                    IsActive = b.IsActive,
                    CreatedAt = b.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<Branch?> GetBranchByIdAsync(Guid id)
        {
            return await _context.Branches
                .Include(b => b.Department)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<Branch> CreateBranchAsync(CreateBranchDto dto)
        {
            var branch = new Branch
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                BranchCode = dto.BranchCode,
                Location = dto.Location,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow // Fallback safety metric if database doesn't default it
            };

            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();

            return branch;
        }

        public async Task<bool> UpdateBranchAsync(Guid id, UpdateBranchDto dto)
        {
            var branch = await _context.Branches.FindAsync(id);
            if (branch == null) return false;

            // Map updated parameter details back to tracked persistent Entity
            branch.Name = dto.Name;
            branch.BranchCode = dto.BranchCode;
            branch.Location = dto.Location;
            branch.IsActive = dto.IsActive;

            _context.Entry(branch).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteBranchAsync(Guid id)
        {
            var branch = await _context.Branches.FindAsync(id);
            if (branch == null) return false;

            _context.Branches.Remove(branch);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}