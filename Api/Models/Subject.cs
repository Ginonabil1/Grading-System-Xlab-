using System.ComponentModel.DataAnnotations;

namespace GradingSystem.Api.Models;

public sealed class Subject
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public ICollection<StudentGrade> StudentGrades { get; set; } = new List<StudentGrade>();
}
