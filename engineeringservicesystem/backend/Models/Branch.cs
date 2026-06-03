namespace backend.Models;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Branch
{
    public Guid Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50)]
    public string BranchCode { get; set; } = string.Empty;
    
    public string? Location { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public string? ManagerId { get; set; }
    
    [ForeignKey("ManagerId")]
    public ApplicationUser? Manager { get; set; }
    
    public Guid? DepartmentId { get; set; }
    
    // Navigation properties
    public Department? Department { get; set; }
    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
