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
    public class BranchesController : ControllerBase
    {
        private readonly IBranchesService _branchesService;

        public BranchesController(IBranchesService branchesService)
        {
            _branchesService = branchesService;
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<BranchResponseDto>))]
        public async Task<IActionResult> GetBranches()
        {
            var branches = await _branchesService.GetBranchesAsync();
            return Ok(branches);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(Branch))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Branch>> GetBranch(Guid id)
        {
            var branch = await _branchesService.GetBranchByIdAsync(id);
            if (branch == null) return NotFound();

            return Ok(branch);
        }

        [HttpPost]
        [Authorize(Policy = Permissions.OrgManagementManage)]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(Branch))]
        public async Task<ActionResult<Branch>> PostBranch([FromBody] CreateBranchDto branchDto)
        {
            var createdBranch = await _branchesService.CreateBranchAsync(branchDto);
            return CreatedAtAction(nameof(GetBranch), new { id = createdBranch.Id }, createdBranch);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Permissions.OrgManagementManage)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> PutBranch(Guid id, [FromBody] UpdateBranchDto branchDto)
        {
            if (id != branchDto.Id) return BadRequest();

            var updated = await _branchesService.UpdateBranchAsync(id, branchDto);
            if (!updated) return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.OrgManagementManage)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteBranch(Guid id)
        {
            var deleted = await _branchesService.DeleteBranchAsync(id);
            if (!deleted) return NotFound();

            return NoContent();
        }
    }
}