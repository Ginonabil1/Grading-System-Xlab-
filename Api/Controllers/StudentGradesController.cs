using GradingSystem.Api.Contracts;
using GradingSystem.Api.Data;
using GradingSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GradingSystem.Api.Controllers;

[ApiController]
[Route("api/student-grades")]
public sealed class StudentGradesController(GradingDbContext dbContext) : ControllerBase
{
    [HttpGet("statistics")]
    public async Task<ActionResult<StudentGradeStatisticsResponse>> GetStatistics(
        [FromQuery] int? subjectId,
        CancellationToken cancellationToken)
    {
        if (!subjectId.HasValue || subjectId.Value <= 0)
        {
            return BadRequest(new { message = "A valid subjectId is required." });
        }

        var statistics = await dbContext.Subjects
            .AsNoTracking()
            .Where(item => item.Id == subjectId.Value)
            .Select(subject => new StudentGradeStatisticsResponse(
                subject.Id,
                subject.Name,
                subject.StudentGrades.Count(),
                subject.StudentGrades.Count(grade =>
                    grade.Term1Mark + grade.Term2Mark >= GradeScale.GradeDMinimum),
                subject.StudentGrades.Count(grade =>
                    grade.Term1Mark + grade.Term2Mark < GradeScale.GradeDMinimum),
                subject.StudentGrades.Count(grade =>
                    grade.Term1Mark + grade.Term2Mark == GradeScale.GradeDMinimum)))
            .SingleOrDefaultAsync(cancellationToken);

        if (statistics is null)
        {
            return NotFound(new { message = "The specified subject does not exist." });
        }

        return Ok(statistics);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StudentGradeResponse>>> GetAll(
        [FromQuery] int? studentId,
        [FromQuery] int? subjectId,
        CancellationToken cancellationToken)
    {
        var query = dbContext.StudentGrades.AsNoTracking();

        if (studentId.HasValue)
        {
            query = query.Where(grade => grade.StudentId == studentId.Value);
        }

        if (subjectId.HasValue)
        {
            query = query.Where(grade => grade.SubjectId == subjectId.Value);
        }

        var grades = await ProjectResponses(query
                .OrderBy(grade => grade.Student.Name)
                .ThenBy(grade => grade.Subject.Name))
            .ToListAsync(cancellationToken);

        return Ok(grades);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<StudentGradeResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var grade = await ProjectResponses(dbContext.StudentGrades
                .AsNoTracking()
                .Where(grade => grade.Id == id))
            .SingleOrDefaultAsync(cancellationToken);

        return grade is null ? NotFound() : Ok(grade);
    }

    [HttpPost]
    public async Task<ActionResult<StudentGradeResponse>> Create(
        CreateStudentGradeRequest request,
        CancellationToken cancellationToken)
    {
        var references = await dbContext.Students
            .AsNoTracking()
            .Where(student => student.Id == request.StudentId)
            .Select(student => new
            {
                student.Id,
                SubjectExists = dbContext.Subjects.Any(subject => subject.Id == request.SubjectId)
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (references is null)
        {
            return BadRequest(new { message = "The specified student does not exist." });
        }

        if (!references.SubjectExists)
        {
            return BadRequest(new { message = "The specified subject does not exist." });
        }

        var grade = new StudentGrade
        {
            StudentId = request.StudentId,
            SubjectId = request.SubjectId,
            Term1Mark = request.Term1Mark!.Value,
            Term2Mark = request.Term2Mark!.Value
        };

        dbContext.StudentGrades.Add(grade);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (SqlServerConstraintErrors.IsUniqueConstraintViolation(exception))
        {
            return Conflict(new { message = "A grade record already exists for this student and subject." });
        }

        var response = await ProjectResponses(dbContext.StudentGrades
                .AsNoTracking()
                .Where(item => item.Id == grade.Id))
            .SingleAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = grade.Id }, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateStudentGradeRequest request,
        CancellationToken cancellationToken)
    {
        var grade = await dbContext.StudentGrades.FindAsync([id], cancellationToken);
        if (grade is null)
        {
            return NotFound();
        }

        grade.Term1Mark = request.Term1Mark!.Value;
        grade.Term2Mark = request.Term2Mark!.Value;
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var grade = await dbContext.StudentGrades.FindAsync([id], cancellationToken);
        if (grade is null)
        {
            return NotFound();
        }

        dbContext.StudentGrades.Remove(grade);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static IQueryable<StudentGradeResponse> ProjectResponses(IQueryable<StudentGrade> query) =>
        query.Select(grade => new StudentGradeResponse(
            grade.Id,
            grade.StudentId,
            grade.Student.Name,
            grade.Student.NationalId,
            grade.Student.AcademicYear,
            grade.SubjectId,
            grade.Subject.Name,
            grade.Term1Mark,
            grade.Term2Mark,
            grade.Term1Mark + grade.Term2Mark,
            grade.Term1Mark + grade.Term2Mark >= GradeScale.GradeAMinimum ? "A" :
            grade.Term1Mark + grade.Term2Mark >= GradeScale.GradeBMinimum ? "B" :
            grade.Term1Mark + grade.Term2Mark >= GradeScale.GradeCMinimum ? "C" :
            grade.Term1Mark + grade.Term2Mark >= GradeScale.GradeDMinimum ? "D" : "F"));
}
