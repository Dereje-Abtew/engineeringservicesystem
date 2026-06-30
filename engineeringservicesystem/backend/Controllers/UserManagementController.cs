using backend.Constants;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Controllers
{
    // [Authorize(Policy = Permissions.UserManagementManage)]
    [Route("api/[controller]")]
    [ApiController]
    public class UserManagementController : ControllerBase
    {
        private readonly IUserManagementService _userService;

        public UserManagementController(IUserManagementService userService)
        {
            _userService = userService;
        }

        // 💡 404 ስህተቱን ለመፍታት እዚህ ጋር አዲስ Endpoint ተጨምሯል
        [HttpGet("engineering-officers")]
        public async Task<IActionResult> GetEngineeringOfficers()
        {
            var officers = await _userService.GetEngineeringOfficersAsync();
            return Ok(officers);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userService.GetUsersAsync();
            return Ok(users);
        }

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUser(string id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserDto model)
        {
            var (succeeded, errors, errorMessage) = await _userService.RegisterUserAsync(model);
            if (!succeeded)
            {
                return BadRequest(new { Message = errorMessage ?? "Registration failed", Errors = errors });
            }
            return Ok(new { Message = "User created successfully!" });
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto model)
        {
            var (succeeded, errors, errorMessage) = await _userService.UpdateUserAsync(id, model);
            if (!succeeded)
            {
                if (errors == null && errorMessage == "User not found!") return NotFound();
                return BadRequest(new { Message = errorMessage ?? "Update failed!", Errors = errors });
            }
            return Ok(new { Message = "User updated successfully!" });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var succeeded = await _userService.DeleteUserAsync(id);
            if (!succeeded) return NotFound(new { message = "User not found or could not be deleted." });
            return NoContent();
        }

        [HttpPost("users/{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordModel model)
        {
            var (succeeded, errors) = await _userService.ResetPasswordAsync(id, model);
            if (!succeeded)
            {
                if (errors == null) return NotFound();
                return BadRequest(new { Message = "Password reset failed!", Errors = errors });
            }
            return Ok(new { Message = "Password reset successfully!" });
        }

        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _userService.GetRolesAsync();
            return Ok(roles);
        }

        [HttpPost("roles")]
        public async Task<IActionResult> CreateRole([FromBody] RoleRequest model)
        {
            if (string.IsNullOrEmpty(model.Name)) return BadRequest();

            var (succeeded, errorMessage) = await _userService.CreateRoleAsync(model);
            if (!succeeded)
            {
                return BadRequest(new { Message = errorMessage });
            }
            return Ok();
        }

        [HttpPut("roles/{id}")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] RoleRequest model)
        {
            var (succeeded, errorMessage) = await _userService.UpdateRoleAsync(id, model);
            if (!succeeded)
            {
                return BadRequest(new { Message = errorMessage });
            }
            return Ok();
        }

        [HttpDelete("roles/{id}")]
        public async Task<IActionResult> DeleteRole(string id)
        {
            var (succeeded, errorMessage, errors) = await _userService.DeleteRoleAsync(id);
            if (!succeeded)
            {
                return BadRequest(new { Message = errorMessage, Errors = errors });
            }
            return Ok();
        }

        [HttpPut("roles/{id}/permissions")]
        public async Task<IActionResult> UpdateRolePermissions(string id, [FromBody] List<string> permissions)
        {
            var succeeded = await _userService.UpdateRolePermissionsAsync(id, permissions);
            if (!succeeded) return NotFound();
            return Ok();
        }

        [HttpGet("permissions")]
        public IActionResult GetPermissions()
        {
            return Ok(Permissions.GetAll());
        }
    }
}