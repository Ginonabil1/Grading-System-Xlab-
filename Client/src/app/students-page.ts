import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GradingApi, Student, StudentGrade, StudentInput, Subject } from './grading-api';
import {
  ACADEMIC_YEAR_GROUPS,
  compareAcademicYears,
  normalizeAcademicYear,
} from './academic-years';
import { forkJoin } from 'rxjs';

interface StudentProfileSubject {
  subject: Subject;
  grade: StudentGrade | null;
}

@Component({
  selector: 'app-students-page',
  imports: [FormsModule],
  templateUrl: './students-page.html',
  styleUrl: './students-page.css',
})
export class StudentsPage implements OnInit {
  private readonly api = inject(GradingApi);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private requestId = 0;
  private profileRequestId = 0;
  readonly gradeOptions = ['A', 'B', 'C', 'D', 'F'];
  readonly academicYearGroups = ACADEMIC_YEAR_GROUPS;
  readonly academicYearOptions = ACADEMIC_YEAR_GROUPS.flatMap((group) => group.options);

  students: Student[] = [];
  searchTerm = '';
  gradeLetter = '';
  formOpen = false;
  editingId: number | null = null;
  saving = false;
  loading = false;
  error = '';
  notice = '';
  noticeType: 'success' | 'error' = 'success';
  form: StudentInput = this.emptyForm();
  selectedStudent: Student | null = null;
  profileSubjects: StudentProfileSubject[] = [];
  profileLoading = false;
  profileError = '';

  get studentGroups(): { key: string; academicYear: string; students: Student[] }[] {
    const groups = new Map<string, { key: string; academicYear: string; students: Student[] }>();
    for (const student of this.students) {
      const academicYear =
        normalizeAcademicYear(student.academicYear) || 'Unspecified academic year';
      const key = academicYear.toLocaleLowerCase();
      const group = groups.get(key) ?? { key, academicYear, students: [] };
      group.students.push(student);
      groups.set(key, group);
    }
    return [...groups.values()]
      .map((group) => ({
        ...group,
        students: [...group.students].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        ),
      }))
      .sort((a, b) => compareAcademicYears(a.academicYear, b.academicYear));
  }

  ngOnInit(): void {
    this.loadStudents();
  }

  scheduleSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.loadStudents(), 300);
  }

  loadStudents(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = undefined;
    }
    const requestId = ++this.requestId;
    this.loading = true;
    this.error = '';
    this.api.getStudents(this.searchTerm, this.gradeLetter).subscribe({
      next: (students) => {
        if (requestId !== this.requestId) return;
        this.students = students;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        if (requestId !== this.requestId) return;
        this.error = this.errorMessage(
          error,
          'Could not load students. Check that the API is running.',
        );
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  showNotice(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.notice = message;
    this.noticeType = type;
    this.noticeTimer = setTimeout(() => {
      this.notice = '';
      this.changeDetector.markForCheck();
    }, 3500);
    this.changeDetector.markForCheck();
  }

  dismissNotice(): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
    this.notice = '';
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
      academicYear: normalizeAcademicYear(student.academicYear),
    };
    this.formOpen = false;
    this.notice = '';
  }

  validStudentForm(): boolean {
    return (
      this.form.name.trim().length > 0 &&
      /^[0-9]{14}$/.test(this.form.nationalId.trim()) &&
      this.form.academicYear.trim().length > 0
    );
  }

  hasKnownAcademicYear(value: string): boolean {
    return this.academicYearOptions.includes(value);
  }

  formatAcademicYear(value: string): string {
    return normalizeAcademicYear(value);
  }

  openStudentProfile(student: Student): void {
    this.selectedStudent = student;
    this.profileSubjects = [];
    this.profileError = '';
    this.profileLoading = true;
    const requestId = ++this.profileRequestId;

    forkJoin({
      subjects: this.api.getSubjects(),
      grades: this.api.getStudentGrades(student.id),
    }).subscribe({
      next: ({ subjects, grades }) => {
        if (requestId !== this.profileRequestId) return;
        const gradesBySubject = new Map(grades.map((grade) => [grade.subjectId, grade]));
        this.profileSubjects = [...subjects]
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
          .map((subject) => ({ subject, grade: gradesBySubject.get(subject.id) ?? null }));
        this.profileLoading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        if (requestId !== this.profileRequestId) return;
        this.profileError = this.errorMessage(error, 'Could not load this student’s profile.');
        this.profileLoading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  closeStudentProfile(): void {
    this.profileRequestId++;
    this.selectedStudent = null;
    this.profileSubjects = [];
    this.profileLoading = false;
    this.profileError = '';
  }

  cancelForm(): void {
    this.formOpen = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }

  saveStudent(): void {
    if (!this.validStudentForm() || this.saving) return;
    const payload: StudentInput = {
      name: this.form.name.trim(),
      nationalId: this.form.nationalId.trim(),
      academicYear: this.form.academicYear.trim(),
    };
    this.saving = true;
    this.error = '';
    const finishSave = (notice: string): void => {
      this.showNotice(notice);
      this.saving = false;
      this.cancelForm();
      this.changeDetector.markForCheck();
    };
    const onError = (error: unknown): void => {
      this.error = this.errorMessage(error, 'Could not save this student.');
      this.saving = false;
      this.changeDetector.markForCheck();
    };

    if (this.editingId === null) {
      this.api.createStudent(payload).subscribe({
        next: (student) => {
          finishSave('Student added.');
          if (this.searchTerm || this.gradeLetter) {
            this.loadStudents();
          } else {
            this.students = [...this.students, student].sort((a, b) =>
              a.name.localeCompare(b.name),
            );
          }
          this.changeDetector.markForCheck();
        },
        error: onError,
      });
    } else {
      const id = this.editingId;
      this.api.updateStudent(id, payload).subscribe({
        next: () => {
          finishSave('Student details updated.');
          if (this.searchTerm || this.gradeLetter) {
            this.loadStudents();
          } else {
            this.students = this.students
              .map((student) => (student.id === id ? { ...student, ...payload } : student))
              .sort((a, b) => a.name.localeCompare(b.name));
          }
          this.changeDetector.markForCheck();
        },
        error: onError,
      });
    }
  }

  deleteStudent(student: Student): void {
    if (!window.confirm(`Delete ${student.name}? Their grade records will also be deleted.`))
      return;
    this.error = '';
    this.api.deleteStudent(student.id).subscribe({
      next: () => {
        this.showNotice('Student deleted.', 'error');
        this.students = this.students.filter((item) => item.id !== student.id);
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not delete this student.');
        this.changeDetector.markForCheck();
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
