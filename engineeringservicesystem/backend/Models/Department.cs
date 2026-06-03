namespace backend.Models;

using System.ComponentModel.DataAnnotations;

public class Department
{
    public Guid Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public string? HeadId { get; set; }
    
    [System.ComponentModel.DataAnnotations.Schema.ForeignKey("HeadId")]
    public ApplicationUser? Head { get; set; }
    
    // Navigation property
    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
