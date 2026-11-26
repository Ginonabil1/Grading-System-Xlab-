using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace GradingSystem.Api.Data;

public static class SqlServerConstraintErrors
{
    public static bool IsUniqueConstraintViolation(DbUpdateException exception) =>
        exception.InnerException is SqlException { Number: 2601 or 2627 };
}
