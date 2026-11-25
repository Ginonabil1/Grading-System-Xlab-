using GradingSystem.Api.Contracts;
using GradingSystem.Api.Data;
using GradingSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GradingSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class StudentsController(GradingDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StudentResponse>>> GetAll(
        [FromQuery] string? searchTerm,
        [FromQuery] string? gradeLetter,
        CancellationToken cancellationToken)
    {
        IQueryable<Student> query = dbContext.Students.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim();
            query = query.Where(student =>
                student.Name.Contains(term) ||
                student.NationalId.Contains(term) ||
                student.AcademicYear.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(gradeLetter))
        {
            var normalizedGrade = gradeLetter.Trim().ToUpperInvariant();
            if (normalizedGrade.Length != 1 || !"ABCDF".Contains(normalizedGrade, StringComparison.Ordinal))
            {
                return BadRequest(new { message = "Grade letter must be A, B, C, D, or F." });
            }

            query = normalizedGrade switch
            {
                "A" => query.Where(student => student.Grades.Any(grade =>
                    grade.Term1Mark + grade.Term2Mark >= GradeScale.GradeAMinimum)),
                "B" => query.Where(student => student.Grades.Any(grade =>
                    grade.Term1Mark + grade.Term2Mark >= GradeScale.GradeBMinimum &&
                    grade.Term1Mark + grade.Term2Mark < GradeScale.GradeAMinimum)),
                "C" => query.Where(student => student.Grades.Any(grade =>
                    grade.Term1Mark + grade.Term2Mark >= GradeScale.GradeCMinimum &&
                    grade.Term1Mark + grade.Term2Mark < GradeScale.GradeBMinimum)),
                "D" => query.Where(student => student.Grades.Any(grade =>
                    grade.Term1Mark + grade.Term2Mark >= GradeScale.GradeDMinimum &&
                    grade.Term1Mark + grade.Term2Mark < GradeScale.GradeCMinimum)),
                "F" => query.Where(student => student.Grades.Any(grade =>
                    grade.Term1Mark + grade.Term2Mark < GradeScale.GradeDMinimum)),
                _ => query
            };
        }

        var students = await query
            .OrderBy(student => student.Name)
            .ThenBy(student => student.Id)
            .Select(student => new StudentResponse(
                student.Id,
                student.Name,
                student.NationalId,
                student.AcademicYear))
            .ToListAsync(cancellationToken);

        return Ok(students);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<StudentResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var student = await dbContext.Students
            .AsNoTracking()
            .Where(student => student.Id == id)
            .Select(student => new StudentResponse(
                student.Id,
                student.Name,
                student.NationalId,
                student.AcademicYear))
            .SingleOrDefaultAsync(cancellationToken);

        return student is null ? NotFound() : Ok(student);
    }

    [HttpPost]
    public async Task<ActionResult<StudentResponse>> Create(
        StudentRequest request,
        CancellationToken cancellationToken)
    {
        if (await dbContext.Students.AnyAsync(
                student => student.NationalId == request.NationalId,
                cancellationToken))
        {
            return Conflict(new { message = "A student with this National ID already exists." });
        }

        var student = new Student
        {
            Name = request.Name.Trim(),
            NationalId = request.NationalId,
            AcademicYear = request.AcademicYear.Trim()
        };

        dbContext.Students.Add(student);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = ToResponse(student);
        return CreatedAtAction(nameof(GetById), new { id = student.Id }, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        StudentRequest request,
        CancellationToken cancellationToken)
    {
        var student = await dbContext.Students.FindAsync([id], cancellationToken);
        if (student is null)
        {
            return NotFound();
        }

        if (await dbContext.Students.AnyAsync(
                other => other.Id != id && other.NationalId == request.NationalId,
                cancellationToken))
        {
            return Conflict(new { message = "A student with this National ID already exists." });
        }

        student.Name = request.Name.Trim();
        student.NationalId = request.NationalId;
        student.AcademicYear = request.AcademicYear.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var student = await dbContext.Students.FindAsync([id], cancellationToken);
        if (student is null)
        {
            return NotFound();
        }

        dbContext.Students.Remove(student);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static StudentResponse ToResponse(Student student) => new(
        student.Id,
        student.Name,
        student.NationalId,
        student.AcademicYear);
}
