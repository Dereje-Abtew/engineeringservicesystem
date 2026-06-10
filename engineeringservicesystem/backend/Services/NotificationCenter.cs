using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using backend.DTOs;

namespace backend.Services
{
    public static class NotificationCenter
    {
        private static readonly ConcurrentDictionary<int, NotificationRecord> _store = new ConcurrentDictionary<int, NotificationRecord>();
        private static int _nextId = 0;

        static NotificationCenter()
        {
            // seed example
            Create("Welcome", "Notifications system initialized", Array.Empty<string>(), Array.Empty<string>());
        }

        public static backend.DTOs.NotificationDto Create(string title, string message, string[] targetRoles, string[] recommendedUserIds)
        {
            var id = System.Threading.Interlocked.Increment(ref _nextId);
            var rec = new NotificationRecord
            {
                Id = id,
                Title = title,
                Message = message,
                TargetRoles = targetRoles ?? Array.Empty<string>(),
                RecommendedUserIds = recommendedUserIds ?? Array.Empty<string>(),
                CreatedAt = DateTime.UtcNow,
                ReadBy = new HashSet<string>()
            };
            _store[id] = rec;
            return ToDto(rec);
        }

        public static IEnumerable<backend.DTOs.NotificationDto> GetForUser(string userId, string[] roles)
        {
            var results = _store.Values
                .Where(n => (n.TargetRoles == null || n.TargetRoles.Length == 0 || n.TargetRoles.Intersect(roles, StringComparer.OrdinalIgnoreCase).Any())
                         || (n.RecommendedUserIds?.Length > 0 && !string.IsNullOrEmpty(userId) && n.RecommendedUserIds.Contains(userId)))
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => ToDtoForUser(n, userId))
                .ToList();

            return results;
        }

        public static bool MarkRead(int id, string userId)
        {
            if (!_store.TryGetValue(id, out var rec)) return false;
            lock (rec.ReadBy)
            {
                rec.ReadBy.Add(userId);
            }
            return true;
        }

        private static backend.DTOs.NotificationDto ToDto(NotificationRecord rec)
        {
            return new backend.DTOs.NotificationDto
            {
                Id = rec.Id,
                Title = rec.Title,
                Message = rec.Message,
                TargetRoles = rec.TargetRoles,
                RecommendedUserIds = rec.RecommendedUserIds,
                CreatedAt = rec.CreatedAt,
                IsRead = false
            };
        }

        private static backend.DTOs.NotificationDto ToDtoForUser(NotificationRecord rec, string userId)
        {
            return new backend.DTOs.NotificationDto
            {
                Id = rec.Id,
                Title = rec.Title,
                Message = rec.Message,
                TargetRoles = rec.TargetRoles,
                RecommendedUserIds = rec.RecommendedUserIds,
                CreatedAt = rec.CreatedAt,
                IsRead = !string.IsNullOrEmpty(userId) && rec.ReadBy.Contains(userId)
            };
        }

        private class NotificationRecord
        {
            public int Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public string Message { get; set; } = string.Empty;
            public string[] TargetRoles { get; set; } = Array.Empty<string>();
            public string[] RecommendedUserIds { get; set; } = Array.Empty<string>();
            public DateTime CreatedAt { get; set; }
            public HashSet<string> ReadBy { get; set; } = new HashSet<string>();
        }
    }

}

