using GradingSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GradingSystem.Api.Data;

public sealed class GradingDbContext(DbContextOptions<GradingDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<StudentGrade> StudentGrades => Set<StudentGrade>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Student>()
            .HasIndex(student => student.NationalId)
            .IsUnique();

        modelBuilder.Entity<Subject>()
            .HasIndex(subject => subject.Name)
            .IsUnique();

        modelBuilder.Entity<StudentGrade>()
            .ToTable("StudentGrades", table =>
            {
                table.HasCheckConstraint(
                    "CK_StudentGrades_Term1Mark_Range",
                    "[Term1Mark] BETWEEN 0 AND 30");
                table.HasCheckConstraint(
                    "CK_StudentGrades_Term2Mark_Range",
                    "[Term2Mark] BETWEEN 0 AND 30");
            });

        modelBuilder.Entity<StudentGrade>()
            .HasIndex(grade => new { grade.StudentId, grade.SubjectId })
            .IsUnique();

        modelBuilder.Entity<StudentGrade>()
            .HasOne(grade => grade.Student)
            .WithMany(student => student.Grades)
            .HasForeignKey(grade => grade.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentGrade>()
            .HasOne(grade => grade.Subject)
            .WithMany(subject => subject.StudentGrades)
            .HasForeignKey(grade => grade.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
