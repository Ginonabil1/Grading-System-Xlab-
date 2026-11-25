namespace GradingSystem.Api.Contracts;

public sealed record StudentGradeStatisticsResponse(
    int SubjectId,
    string SubjectName,
    int GradedStudents,
    int SucceededStudents,
    int FailedStudents,
    int Exactly50PercentStudents);
