using System.ComponentModel.DataAnnotations;

namespace GradingSystem.Api.Contracts;

public sealed class CreateStudentGradeRequest
{
    [Range(1, int.MaxValue)]
    public int StudentId { get; set; }

    [Range(1, int.MaxValue)]
    public int SubjectId { get; set; }

    [Required]
    [Range(0, 30)]
    public int? Term1Mark { get; set; }

    [Required]
    [Range(0, 30)]
    public int? Term2Mark { get; set; }
}
