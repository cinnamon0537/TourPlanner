import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacadeService } from '../../core/services/auth-facade.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [NgIf, FormsModule, MatButtonModule],
  template: `
    <section class="auth-shell">
      <article class="auth-card">
        <p class="eyebrow">TourPlanner</p>
        <h2>{{ mode === 'login' ? 'Login' : 'Register' }}</h2>
        <p class="lede">Use your account to open the protected dashboard.</p>

        <div class="mode-switch">
          <button type="button" [class.active]="mode === 'login'" (click)="mode = 'login'; clearMessage()">Login</button>
          <button type="button" [class.active]="mode === 'register'" (click)="mode = 'register'; clearMessage()">Register</button>
        </div>

        @if (mode === 'login') {
          <label>
            <span>Identifier</span>
            <input [(ngModel)]="identifier" type="text" placeholder="username or email" />
          </label>
          <label>
            <span>Password</span>
            <input [(ngModel)]="password" type="password" placeholder="Secret123!" />
          </label>
        } @else {
          <label>
            <span>Username</span>
            <input [(ngModel)]="userName" type="text" placeholder="frontend-demo" />
          </label>
          <label>
            <span>Email</span>
            <input [(ngModel)]="email" type="email" placeholder="you@example.com" />
          </label>
          <label>
            <span>Password</span>
            <input [(ngModel)]="password" type="password" placeholder="Secret123!" />
          </label>
        }

        <p class="message" *ngIf="message">{{ message }}</p>

        <div class="auth-actions">
          <button mat-flat-button color="primary" type="button" (click)="submit()">{{ mode === 'login' ? 'Login' : 'Register' }}</button>
        </div>
      </article>
    </section>
  `,
  styles: [`
    :host { display:grid; min-height: calc(100vh - 4rem); place-items:center; }
    .auth-shell { width:min(28rem, 100%); }
    .auth-card { display:grid; gap:.85rem; padding:1.35rem 1.4rem; border-radius:1.1rem; border:1px solid #dbe2ea; background:rgba(255,255,255,0.9); box-shadow:0 24px 60px rgba(15,23,42,0.08); }
    .eyebrow { margin:0; text-transform:uppercase; letter-spacing:.14em; font-size:.72rem; color:#64748b; }
    h2 { margin:0; font-size:2rem; }
    .lede { margin:0; color:#475569; }
    .mode-switch { display:flex; gap:.5rem; }
    .mode-switch button { flex:1; padding:.6rem .8rem; border-radius:.8rem; border:1px solid #cbd5e1; background:#fff; }
    .mode-switch button.active { background:#0f172a; color:#fff; border-color:#0f172a; }
    label { display:grid; gap:.35rem; color:#334155; }
    input { padding:.8rem .95rem; border:1px solid #cbd5e1; border-radius:.75rem; }
    .message { margin:0; color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; padding:.7rem .85rem; border-radius:.75rem; }
    .auth-actions { display:flex; justify-content:flex-end; }
  `]
})
export class LandingPageComponent {
  private router = inject(Router);
  auth = inject(AuthFacadeService);

  mode: 'login' | 'register' = 'login';
  userName = 'frontend-demo';
  email = 'frontend-demo@tourplanner.local';
  identifier = 'frontend-demo';
  password = 'Secret123!';
  message = '';

  async submit(): Promise<void> {
    try {
      if (this.mode === 'login') {
        await this.auth.login(this.identifier, this.password);
      } else {
        await this.auth.register(this.userName, this.email, this.password);
      }

      await this.router.navigateByUrl('/dashboard');
    } catch (err) {
      this.message = this.friendlyError(err);
    }
  }

  clearMessage(): void {
    this.message = '';
  }

  private friendlyError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'Cannot reach the backend right now.';
      if (err.status === 401) return 'Wrong login details. Check your username/email and password.';
      if (err.status === 409) return 'That account already exists. Try logging in instead.';
      if (err.status >= 500) return 'The server had a problem. Please try again.';
    }

    return 'Something went wrong. Please try again.';
  }
}
