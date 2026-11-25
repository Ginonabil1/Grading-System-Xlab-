using System.ComponentModel.DataAnnotations;

namespace GradingSystem.Api.Contracts;

public sealed class SubjectRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
}
