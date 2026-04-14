import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacadeService } from '../../core/services/auth-facade.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">TourPlanner</p>
        <h1>Dashboard</h1>
      </div>

      <button type="button" class="logout" (click)="logout()">Logout</button>
    </header>
  `,
  styles: [`
    .topbar { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:1rem 1.2rem; border:1px solid #dbe2ea; border-radius:1rem; background:rgba(255,255,255,0.85); box-shadow:0 18px 40px rgba(15,23,42,0.05); }
    .eyebrow { margin:0 0 .2rem; text-transform:uppercase; letter-spacing:.14em; font-size:.72rem; color:#64748b; }
    h1 { margin:0; font-size:clamp(1.4rem, 2.6vw, 2rem); }
    .logout { padding:.6rem .9rem; border-radius:.8rem; border:1px solid #cbd5e1; background:#fff; }
  `]
})
export class AppTopbarComponent {
  auth = inject(AuthFacadeService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
