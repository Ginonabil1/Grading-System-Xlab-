using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GradingSystem.Api.Models;

public sealed class StudentGrade
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    [Range(0, GradeScale.MaximumMarkPerTerm)]
    public int Term1Mark { get; set; }

    [Range(0, GradeScale.MaximumMarkPerTerm)]
    public int Term2Mark { get; set; }

    [NotMapped]
    public int TotalMark => Term1Mark + Term2Mark;

    [NotMapped]
    public string GradeLetter => GradeScale.GetLetterGrade(TotalMark);
}
