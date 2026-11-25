import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GradeInput,
  GradeStatistics,
  GradingApi,
  Student,
  StudentGrade,
  Subject,
} from './grading-api';

@Component({
  selector: 'app-grades-page',
  imports: [FormsModule],
  templateUrl: './grades-page.html',
  styleUrl: './grades-page.css',
})
export class GradesPage implements OnInit {
  private readonly api = inject(GradingApi);

  subjects: Subject[] = [];
  students: Student[] = [];
  grades: StudentGrade[] = [];
  selectedSubjectId: number | null = null;
  statistics: GradeStatistics | null = null;
  gradeFormOpen = false;
  subjectFormOpen = false;
  newSubjectName = '';
  newStudentId: number | null = null;
  newTerm1: number | null = null;
  newTerm2: number | null = null;
  editingGradeId: number | null = null;
  editingTerm1: number | null = null;
  editingTerm2: number | null = null;
  loading = false;
  saving = false;
  error = '';
  notice = '';

  ngOnInit(): void {
    this.loadStudents();
    this.loadSubjects();
  }

  loadStudents(): void {
    this.api.getStudentsForGrades().subscribe({
      next: (students) => this.students = students,
      error: (error: unknown) => this.error = this.errorMessage(error, 'Could not load students.'),
    });
  }

  loadSubjects(preferredId?: number): void {
    this.api.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects = subjects;
        if (preferredId !== undefined) {
          this.selectedSubjectId = preferredId;
        } else if (!subjects.some((subject) => subject.id === this.selectedSubjectId)) {
          this.selectedSubjectId = subjects[0]?.id ?? null;
        }
        this.loadSubjectData();
      },
      error: (error: unknown) => this.error = this.errorMessage(error, 'Could not load subjects.'),
    });
  }

  changeSubject(subjectId: number | null): void {
    this.selectedSubjectId = subjectId;
    this.notice = '';
    this.loadSubjectData();
  }

  loadSubjectData(): void {
    const subjectId = this.selectedSubjectId;
    if (subjectId === null) {
      this.grades = [];
      this.statistics = null;
      return;
    }

    this.loading = true;
    this.error = '';
    this.api.getGrades(subjectId).subscribe({
      next: (grades) => {
        this.grades = grades;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not load grades.');
        this.loading = false;
      },
    });
    this.api.getStatistics(subjectId).subscribe({
      next: (statistics) => this.statistics = statistics,
      error: (error: unknown) => this.error = this.errorMessage(error, 'Could not load grade statistics.'),
    });
  }

  createSubject(): void {
    const name = this.newSubjectName.trim();
    if (!name) return;
    this.saving = true;
    this.error = '';
    this.api.createSubject(name).subscribe({
      next: (subject) => {
        this.notice = `Subject “${subject.name}” added.`;
        this.newSubjectName = '';
        this.subjectFormOpen = false;
        this.saving = false;
        this.loadSubjects(subject.id);
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not add this subject.');
        this.saving = false;
      },
    });
  }

  createGrade(): void {
    if (this.selectedSubjectId === null || this.newStudentId === null ||
        this.newTerm1 === null || this.newTerm2 === null ||
        !this.validMarks(this.newTerm1, this.newTerm2)) return;
    const request: GradeInput = {
      subjectId: this.selectedSubjectId,
      studentId: this.newStudentId,
      term1Mark: this.newTerm1,
      term2Mark: this.newTerm2,
    };

    this.saving = true;
    this.error = '';
    this.api.createGrade(request).subscribe({
      next: () => {
        this.notice = 'Grade saved.';
        this.newStudentId = null;
        this.newTerm1 = null;
        this.newTerm2 = null;
        this.gradeFormOpen = false;
        this.saving = false;
        this.loadSubjectData();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not save this grade.');
        this.saving = false;
      },
    });
  }

  startEdit(grade: StudentGrade): void {
    this.editingGradeId = grade.id;
    this.editingTerm1 = grade.term1Mark;
    this.editingTerm2 = grade.term2Mark;
  }

  cancelEdit(): void {
    this.editingGradeId = null;
    this.editingTerm1 = null;
    this.editingTerm2 = null;
  }

  saveEdit(): void {
    if (this.editingGradeId === null || this.editingTerm1 === null || this.editingTerm2 === null ||
        !this.validMarks(this.editingTerm1, this.editingTerm2)) return;
    this.saving = true;
    this.error = '';
    this.api.updateGrade(this.editingGradeId, {
      term1Mark: this.editingTerm1,
      term2Mark: this.editingTerm2,
    }).subscribe({
      next: () => {
        this.notice = 'Grade updated.';
        this.saving = false;
        this.cancelEdit();
        this.loadSubjectData();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not update this grade.');
        this.saving = false;
      },
    });
  }

  deleteGrade(grade: StudentGrade): void {
    if (!window.confirm(`Delete ${grade.studentName}’s ${grade.subjectName} grade record?`)) return;
    this.api.deleteGrade(grade.id).subscribe({
      next: () => {
        this.notice = 'Grade deleted.';
        this.loadSubjectData();
      },
      error: (error: unknown) => this.error = this.errorMessage(error, 'Could not delete this grade.'),
    });
  }

  validMarks(term1: number | null, term2: number | null): term1 is number {
    return term1 !== null && term2 !== null &&
      Number.isInteger(term1) && Number.isInteger(term2) &&
      term1 >= 0 && term1 <= 30 && term2 >= 0 && term2 <= 30;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.error?.title ?? fallback;
    }
    return fallback;
  }
}
