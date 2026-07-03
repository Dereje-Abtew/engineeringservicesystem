using System;
using System.Collections.Generic;

namespace backend.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string[] TargetRoles { get; set; } = Array.Empty<string>();
        public string[] RecommendedUserIds { get; set; } = Array.Empty<string>();
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
        public int? RequestId { get; set; }
        public string? BranchId { get; set; }
    }
}