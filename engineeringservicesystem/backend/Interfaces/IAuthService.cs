using backend.Models;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginModel model);
        Task<(bool Succeeded, string ErrorMessage)> RegisterAsync(RegisterModel model);
        Task<(bool Succeeded, IEnumerable<IdentityError>? Errors)> ChangePasswordAsync(string userId, ServiceChangePasswordModel model);
    }

    public class LoginResponseDto
    {
        public required string Token { get; set; }
        public DateTime Expiration { get; set; }
        public required string UserId { get; set; }
        public string? Role { get; set; }
        public required string Name { get; set; }
    }

    public class ServiceChangePasswordModel
    {
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
    }
}