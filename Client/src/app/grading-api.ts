import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Student {
  id: number;
  name: string;
  nationalId: string;
  academicYear: string;
}

export interface StudentInput {
  name: string;
  nationalId: string;
  academicYear: string;
}

export interface Subject {
  id: number;
  name: string;
}

export interface StudentGrade {
  id: number;
  studentId: number;
  studentName: string;
  nationalId: string;
  academicYear: string;
  subjectId: number;
  subjectName: string;
  term1Mark: number;
  term2Mark: number;
  totalMark: number;
  gradeLetter: string;
}

export interface GradeStatistics {
  subjectId: number;
  subjectName: string;
  gradedStudents: number;
  succeededStudents: number;
  failedStudents: number;
  exactly50PercentStudents: number;
}

export interface GradeInput {
  studentId: number;
  subjectId: number;
  term1Mark: number;
  term2Mark: number;
}

export interface GradeUpdate {
  term1Mark: number;
  term2Mark: number;
}

@Injectable({ providedIn: 'root' })
export class GradingApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5285/api';

  getStudents(searchTerm = '', gradeLetter = ''): Observable<Student[]> {
    let params = new HttpParams();
    if (searchTerm.trim()) params = params.set('searchTerm', searchTerm.trim());
    if (gradeLetter) params = params.set('gradeLetter', gradeLetter);
    return this.http.get<Student[]>(`${this.apiUrl}/students`, { params });
  }

  createStudent(student: StudentInput): Observable<Student> {
    return this.http.post<Student>(`${this.apiUrl}/students`, student);
  }

  updateStudent(id: number, student: StudentInput): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/students/${id}`, student);
  }

  deleteStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/students/${id}`);
  }

  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects`);
  }

  createSubject(name: string): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiUrl}/subjects`, { name });
  }

  getGrades(subjectId: number): Observable<StudentGrade[]> {
    const params = new HttpParams().set('subjectId', subjectId);
    return this.http.get<StudentGrade[]>(`${this.apiUrl}/student-grades`, { params });
  }

  getStudentGrades(studentId: number): Observable<StudentGrade[]> {
    const params = new HttpParams().set('studentId', studentId);
    return this.http.get<StudentGrade[]>(`${this.apiUrl}/student-grades`, { params });
  }

  getStatistics(subjectId: number): Observable<GradeStatistics> {
    const params = new HttpParams().set('subjectId', subjectId);
    return this.http.get<GradeStatistics>(`${this.apiUrl}/student-grades/statistics`, { params });
  }

  createGrade(grade: GradeInput): Observable<StudentGrade> {
    return this.http.post<StudentGrade>(`${this.apiUrl}/student-grades`, grade);
  }

  updateGrade(id: number, grade: GradeUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/student-grades/${id}`, grade);
  }

  deleteGrade(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/student-grades/${id}`);
  }
}
