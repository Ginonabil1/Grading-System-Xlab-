using System.ComponentModel.DataAnnotations;

namespace GradingSystem.Api.Contracts;

public sealed class StudentRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(14, MinimumLength = 14)]
    [RegularExpression(@"^\d{14}$", ErrorMessage = "National ID must contain exactly 14 digits.")]
    public string NationalId { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string AcademicYear { get; set; } = string.Empty;
}
