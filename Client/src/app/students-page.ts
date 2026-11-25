import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GradingApi, Student, StudentInput } from './grading-api';

@Component({
  selector: 'app-students-page',
  imports: [FormsModule],
  templateUrl: './students-page.html',
  styleUrl: './students-page.css',
})
export class StudentsPage implements OnInit {
  private readonly api = inject(GradingApi);
  readonly gradeOptions = ['A', 'B', 'C', 'D', 'F'];

  students: Student[] = [];
  searchTerm = '';
  gradeLetter = '';
  formOpen = false;
  editingId: number | null = null;
  saving = false;
  loading = false;
  error = '';
  notice = '';
  form: StudentInput = this.emptyForm();

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading = true;
    this.error = '';
    this.api.getStudents(this.searchTerm, this.gradeLetter).subscribe({
      next: (students) => {
        this.students = students;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not load students. Check that the API is running.');
        this.loading = false;
      },
    });
  }

  openCreateForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.formOpen = true;
    this.notice = '';
  }

  editStudent(student: Student): void {
    this.editingId = student.id;
    this.form = {
      name: student.name,
      nationalId: student.nationalId,
      academicYear: student.academicYear,
    };
    this.formOpen = true;
    this.notice = '';
  }

  cancelForm(): void {
    this.formOpen = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }

  saveStudent(): void {
    const wasEditing = this.editingId !== null;
    const payload: StudentInput = {
      name: this.form.name.trim(),
      nationalId: this.form.nationalId.trim(),
      academicYear: this.form.academicYear.trim(),
    };
    this.saving = true;
    this.error = '';
    const onSuccess = (): void => {
      this.notice = wasEditing ? 'Student details updated.' : 'Student added.';
      this.saving = false;
      this.cancelForm();
      this.loadStudents();
    };
    const onError = (error: unknown): void => {
      this.error = this.errorMessage(error, 'Could not save this student.');
      this.saving = false;
    };

    if (this.editingId === null) {
      this.api.createStudent(payload).subscribe({ next: onSuccess, error: onError });
    } else {
      this.api.updateStudent(this.editingId, payload).subscribe({ next: onSuccess, error: onError });
    }
  }

  deleteStudent(student: Student): void {
    if (!window.confirm(`Delete ${student.name}? Their grade records will also be deleted.`)) return;
    this.error = '';
    this.api.deleteStudent(student.id).subscribe({
      next: () => {
        this.notice = 'Student deleted.';
        this.loadStudents();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not delete this student.');
      },
    });
  }

  private emptyForm(): StudentInput {
    return { name: '', nationalId: '', academicYear: '' };
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.error?.title ?? fallback;
    }
    return fallback;
  }
}
