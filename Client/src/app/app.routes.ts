import { Routes } from '@angular/router';
import { GradesPage } from './grades-page';
import { StudentsPage } from './students-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'students' },
  { path: 'students', component: StudentsPage, title: 'Students | Gradebook' },
  { path: 'grades', component: GradesPage, title: 'Grades | Gradebook' },
  { path: '**', redirectTo: 'students' },
];
