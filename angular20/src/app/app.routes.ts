import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing-page/landing-page.component').then(x => x.LandingPageComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard-page/dashboard-page.component').then(x => x.DashboardPageComponent) },
  { path: '**', redirectTo: '' },
];
