namespace GradingSystem.Api.Contracts;

public sealed record StudentResponse(
    int Id,
    string Name,
    string NationalId,
    string AcademicYear);
