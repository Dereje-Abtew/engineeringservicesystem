using backend.Constants;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Authorize(Policy = Permissions.OrgManagementView)]
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentsService _departmentsService;

        public DepartmentsController(IDepartmentsService departmentsService)
        {
            _departmentsService = departmentsService;
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<DepartmentResponseDto>))]
        public async Task<IActionResult> GetDepartments()
        {
            var departments = await _departmentsService.GetDepartmentsAsync();
            return Ok(departments);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(Department))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Department>> GetDepartment(Guid id)
        {
            var department = await _departmentsService.GetDepartmentByIdAsync(id);
            if (department == null) return NotFound();

            return Ok(department);
        }

        [HttpPost]
        [Authorize(Policy = Permissions.OrgManagementManage)]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(Department))]
        public async Task<ActionResult<Department>> PostDepartment([FromBody] CreateDepartmentDto dto)
        {
            var createdDepartment = await _departmentsService.CreateDepartmentAsync(dto);
            return CreatedAtAction(nameof(GetDepartment), new { id = createdDepartment.Id }, createdDepartment);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Permissions.OrgManagementManage)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> PutDepartment(Guid id, [FromBody] UpdateDepartmentDto dto)
        {
            if (id != dto.Id) return BadRequest();

            var updated = await _departmentsService.UpdateDepartmentAsync(id, dto);
            if (!updated) return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.OrgManagementManage)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteDepartment(Guid id)
        {
            var deleted = await _departmentsService.DeleteDepartmentAsync(id);
            if (!deleted) return NotFound();

            return NoContent();
        }
    }
}