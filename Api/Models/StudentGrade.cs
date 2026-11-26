namespace GradingSystem.Api.Models;

public sealed class StudentGrade
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public int Term1Mark { get; set; }

    public int Term2Mark { get; set; }
}
