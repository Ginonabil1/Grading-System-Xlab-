namespace GradingSystem.Api.Contracts;

public sealed record StudentGradeResponse(
    int Id,
    int StudentId,
    string StudentName,
    string NationalId,
    string AcademicYear,
    int SubjectId,
    string SubjectName,
    int Term1Mark,
    int Term2Mark,
    int TotalMark,
    string GradeLetter);
