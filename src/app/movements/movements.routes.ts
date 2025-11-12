import { Routes } from '@angular/router';

export const MOVEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./movements-list/movements-list.component').then(
        m => m.MovementListComponent
      )
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./movement-form/movement-form.component').then(
        m => m.MovementFormComponent
      )
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./movement-form/movement-form.component').then(
        m => m.MovementFormComponent
      )
  }
];
