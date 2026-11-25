using System.ComponentModel.DataAnnotations;

namespace GradingSystem.Api.Contracts;

public sealed class UpdateStudentGradeRequest
{
    [Required]
    [Range(0, 30)]
    public int? Term1Mark { get; set; }

    [Required]
    [Range(0, 30)]
    public int? Term2Mark { get; set; }
}
