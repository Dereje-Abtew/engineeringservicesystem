using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface IBranchesService
    {
        Task<IEnumerable<BranchResponseDto>> GetBranchesAsync();
        Task<Branch?> GetBranchByIdAsync(Guid id);
        Task<Branch> CreateBranchAsync(CreateBranchDto dto);
        Task<bool> UpdateBranchAsync(Guid id, UpdateBranchDto dto);
        Task<bool> DeleteBranchAsync(Guid id);
    }

    // --- Strongly Typed DTOs for Client/Server Contract Consistency ---
    
    public class BranchResponseDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public string? BranchCode { get; set; }
        public string? Location { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateBranchDto
    {
        public required string Name { get; set; }
        public string? BranchCode { get; set; }
        public string? Location { get; set; }
        public bool IsActive { get; set; }
        // Include any other editable entity properties or nested parameters if applicable
    }

    public class UpdateBranchDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public string? BranchCode { get; set; }
        public string? Location { get; set; }
        public bool IsActive { get; set; }
    }
}