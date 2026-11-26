using GradingSystem.Api.Contracts;
using GradingSystem.Api.Data;
using GradingSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GradingSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class SubjectsController(GradingDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SubjectResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var subjects = await dbContext.Subjects
            .AsNoTracking()
            .OrderBy(subject => subject.Name)
            .Select(subject => new SubjectResponse(subject.Id, subject.Name))
            .ToListAsync(cancellationToken);

        return Ok(subjects);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SubjectResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var subject = await dbContext.Subjects
            .AsNoTracking()
            .Where(subject => subject.Id == id)
            .Select(subject => new SubjectResponse(subject.Id, subject.Name))
            .SingleOrDefaultAsync(cancellationToken);

        return subject is null ? NotFound() : Ok(subject);
    }

    [HttpPost]
    public async Task<ActionResult<SubjectResponse>> Create(
        SubjectRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        var subject = new Subject { Name = name };
        dbContext.Subjects.Add(subject);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (SqlServerConstraintErrors.IsUniqueConstraintViolation(exception))
        {
            return Conflict(new { message = "A subject with this name already exists." });
        }

        var response = new SubjectResponse(subject.Id, subject.Name);
        return CreatedAtAction(nameof(GetById), new { id = subject.Id }, response);
    }
}
