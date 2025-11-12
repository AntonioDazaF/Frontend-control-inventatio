import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login/login.component')
      .then(m => m.LoginComponent) 
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'inventory', loadChildren: () => import('./inventory/inventory.routes').then(m => m.INVENTORY_ROUTES) },
      { path: 'movements', loadChildren: () => import('./movements/movements.routes').then(m => m.MOVEMENTS_ROUTES) },
//      { path: 'alerts', loadComponent: () => import('./alerts/alerts').then(m => m.AlertsComponent) },
      { path: 'reports', loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
