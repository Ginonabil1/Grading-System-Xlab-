import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GradeInput,
  GradeStatistics,
  GradingApi,
  Student,
  StudentGrade,
  Subject,
} from './grading-api';
import { compareAcademicYears, normalizeAcademicYear } from './academic-years';

@Component({
  selector: 'app-grades-page',
  imports: [FormsModule],
  templateUrl: './grades-page.html',
  styleUrl: './grades-page.css',
})
export class GradesPage implements OnInit {
  private readonly api = inject(GradingApi);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private studentSearchTimer?: ReturnType<typeof setTimeout>;

  subjects: Subject[] = [];
  students: Student[] = [];
  grades: StudentGrade[] = [];
  selectedSubjectId: number | null = null;
  statistics: GradeStatistics | null = null;
  gradeFormOpen = false;
  subjectFormOpen = false;
  newSubjectName = '';
  newStudentId: number | null = null;
  studentSearch = '';
  filteredStudents: Student[] = [];
  studentPickerOpen = false;
  activeStudentIndex = 0;
  newTerm1: number | null = null;
  newTerm2: number | null = null;
  editingGradeId: number | null = null;
  editingTerm1: number | null = null;
  editingTerm2: number | null = null;
  loading = false;
  saving = false;
  error = '';
  notice = '';
  noticeType: 'success' | 'error' = 'success';

  get gradeGroups(): { key: string; academicYear: string; grades: StudentGrade[] }[] {
    const groups = new Map<string, { key: string; academicYear: string; grades: StudentGrade[] }>();
    for (const grade of this.grades) {
      const academicYear = normalizeAcademicYear(grade.academicYear) || 'Unspecified academic year';
      const key = academicYear.toLocaleLowerCase();
      const group = groups.get(key) ?? { key, academicYear, grades: [] };
      group.grades.push(grade);
      groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => compareAcademicYears(a.academicYear, b.academicYear));
  }

  ngOnInit(): void {
    this.loadStudents();
    this.loadSubjects();
  }

  private showNotice(message: string, type: 'success' | 'error' = 'success'): void {
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

  toggleSubjectForm(): void {
    this.subjectFormOpen = !this.subjectFormOpen;
    if (!this.subjectFormOpen) this.newSubjectName = '';
  }

  cancelSubjectForm(): void {
    this.subjectFormOpen = false;
    this.newSubjectName = '';
  }

  loadStudents(): void {
    this.api.getStudentsForGrades().subscribe({
      next: (students) => {
        this.students = students;
        this.filteredStudents = this.filterStudents(this.studentSearch);
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not load students.');
        this.changeDetector.markForCheck();
      },
    });
  }

  openStudentPicker(): void {
    this.filteredStudents = this.filterStudents(this.studentSearch);
    this.activeStudentIndex = 0;
    this.studentPickerOpen = true;
  }

  searchStudents(search: string): void {
    this.newStudentId = null;
    this.studentPickerOpen = true;
    this.activeStudentIndex = 0;
    if (this.studentSearchTimer) clearTimeout(this.studentSearchTimer);
    this.studentSearchTimer = setTimeout(() => {
      this.filteredStudents = this.filterStudents(search);
      this.changeDetector.markForCheck();
    }, 250);
  }

  selectStudent(student: Student): void {
    if (this.studentSearchTimer) clearTimeout(this.studentSearchTimer);
    this.studentSearchTimer = undefined;
    this.newStudentId = student.id;
    this.studentSearch = `${student.name} · ${student.academicYear}`;
    this.studentPickerOpen = false;
  }

  handleStudentPickerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.studentPickerOpen = false;
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.studentPickerOpen) this.openStudentPicker();
      else if (this.filteredStudents.length) this.activeStudentIndex = Math.min(this.activeStudentIndex + 1, this.filteredStudents.length - 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeStudentIndex = Math.max(this.activeStudentIndex - 1, 0);
      return;
    }
    if (event.key === 'Enter' && this.studentPickerOpen && this.filteredStudents.length) {
      event.preventDefault();
      const index = Math.min(this.activeStudentIndex, this.filteredStudents.length - 1);
      this.selectStudent(this.filteredStudents[index]);
    }
  }

  studentPickerBlur(event: FocusEvent): void {
    const container = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && container.contains(event.relatedTarget)) return;
    setTimeout(() => {
      this.studentPickerOpen = false;
      this.changeDetector.markForCheck();
    }, 0);
  }

  private filterStudents(search: string): Student[] {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return this.students;
    return this.students.filter((student) =>
      `${student.name} ${student.academicYear} ${student.nationalId}`.toLocaleLowerCase().includes(term));
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
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not load subjects.');
        this.changeDetector.markForCheck();
      },
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
      this.changeDetector.markForCheck();
      return;
    }

    this.loading = true;
    this.error = '';
    this.api.getGrades(subjectId).subscribe({
      next: (grades) => {
        this.grades = grades;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not load grades.');
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
    this.api.getStatistics(subjectId).subscribe({
      next: (statistics) => {
        this.statistics = statistics;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not load grade statistics.');
        this.changeDetector.markForCheck();
      },
    });
  }

  createSubject(): void {
    const name = this.newSubjectName.trim();
    if (!name) return;
    this.saving = true;
    this.error = '';
    this.api.createSubject(name).subscribe({
      next: (subject) => {
        this.showNotice(`Subject “${subject.name}” added.`);
        this.newSubjectName = '';
        this.subjectFormOpen = false;
        this.saving = false;
        this.subjects = [...this.subjects, subject].sort((a, b) => a.name.localeCompare(b.name));
        this.selectedSubjectId = subject.id;
        this.grades = [];
        this.statistics = {
          subjectId: subject.id,
          subjectName: subject.name,
          gradedStudents: 0,
          succeededStudents: 0,
          failedStudents: 0,
          exactly50PercentStudents: 0,
        };
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not add this subject.');
        this.saving = false;
        this.changeDetector.markForCheck();
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
      next: (grade) => {
        this.showNotice('Grade saved.');
        if (this.studentSearchTimer) clearTimeout(this.studentSearchTimer);
        this.studentSearchTimer = undefined;
        this.newStudentId = null;
        this.studentSearch = '';
        this.filteredStudents = this.students;
        this.studentPickerOpen = false;
        this.newTerm1 = null;
        this.newTerm2 = null;
        this.gradeFormOpen = false;
        this.saving = false;
        this.grades = this.sortGrades([...this.grades, grade]);
        this.adjustStatistics(null, grade);
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not save this grade.');
        this.saving = false;
        this.changeDetector.markForCheck();
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
    const gradeId = this.editingGradeId;
    const term1Mark = this.editingTerm1;
    const term2Mark = this.editingTerm2;
    this.api.updateGrade(gradeId, {
      term1Mark,
      term2Mark,
    }).subscribe({
      next: () => {
        this.showNotice('Grade updated.');
        this.saving = false;
        const previous = this.grades.find((grade) => grade.id === gradeId);
        if (previous) {
          const totalMark = term1Mark + term2Mark;
          const updated: StudentGrade = {
            ...previous,
            term1Mark,
            term2Mark,
            totalMark,
            gradeLetter: this.letterGrade(totalMark),
          };
          this.grades = this.grades.map((grade) => grade.id === gradeId ? updated : grade);
          this.adjustStatistics(previous, updated);
        }
        this.cancelEdit();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not update this grade.');
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  deleteGrade(grade: StudentGrade): void {
    if (!window.confirm(`Delete ${grade.studentName}’s ${grade.subjectName} grade record?`)) return;
    this.api.deleteGrade(grade.id).subscribe({
      next: () => {
        this.showNotice('Grade deleted.', 'error');
        this.grades = this.grades.filter((item) => item.id !== grade.id);
        this.adjustStatistics(grade, null);
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.errorMessage(error, 'Could not delete this grade.');
        this.changeDetector.markForCheck();
      },
    });
  }

  validMarks(term1: number | null, term2: number | null): term1 is number {
    return term1 !== null && term2 !== null &&
      Number.isInteger(term1) && Number.isInteger(term2) &&
      term1 >= 0 && term1 <= 30 && term2 >= 0 && term2 <= 30;
  }

  private sortGrades(grades: StudentGrade[]): StudentGrade[] {
    return grades.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }

  private letterGrade(totalMark: number): string {
    if (totalMark >= 54) return 'A';
    if (totalMark >= 45) return 'B';
    if (totalMark >= 39) return 'C';
    if (totalMark >= 30) return 'D';
    return 'F';
  }

  private adjustStatistics(previous: StudentGrade | null, next: StudentGrade | null): void {
    if (!this.statistics) {
      if (this.selectedSubjectId !== null) {
        this.api.getStatistics(this.selectedSubjectId).subscribe({
          next: (statistics) => {
            this.statistics = statistics;
            this.changeDetector.markForCheck();
          },
          error: (error: unknown) => {
            this.error = this.errorMessage(error, 'Could not load grade statistics.');
            this.changeDetector.markForCheck();
          },
        });
      }
      return;
    }

    const statistics = { ...this.statistics };
    const applyGrade = (grade: StudentGrade, change: 1 | -1): void => {
      statistics.gradedStudents += change;
      if (grade.totalMark >= 30) statistics.succeededStudents += change;
      else statistics.failedStudents += change;
      if (grade.totalMark === 30) statistics.exactly50PercentStudents += change;
    };

    if (previous) applyGrade(previous, -1);
    if (next) applyGrade(next, 1);
    this.statistics = statistics;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.error?.title ?? fallback;
    }
    return fallback;
  }
}
