import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthFacadeService } from '../../core/services/auth-facade.service';

/** Eintrag in der Dashboard-Navigation (Fragment = Zielbereich auf der Seite). */
interface DashboardNavItem {
  label: string;
  fragment: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <div class="brand">
        <!-- Klick auf den App-Namen führt zurück zur Übersicht -->
        <a
          class="brand-link"
          [routerLink]="['/dashboard']"
          fragment="overview"
          [class.active]="activeFragment() === 'overview'"
        >
          TourPlanner
        </a>
      </div>

      <!--
        Die Links wechseln nur das URL-Fragment (/dashboard#planner).
        Die Dashboard-Seite liest das Fragment und blendet den passenden Bereich ein.
      -->
      <nav class="nav" aria-label="Dashboard-Bereiche">
        @for (item of navItems; track item.fragment) {
          <a
            class="nav-link"
            [routerLink]="['/dashboard']"
            [fragment]="item.fragment"
            [class.active]="activeFragment() === item.fragment"
          >
            {{ item.label }}
          </a>
        }
      </nav>

      <button type="button" class="logout" (click)="logout()">Abmelden</button>
    </header>
  `,
  styles: [`
    .topbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.2rem;
      border: 1px solid #dbe2ea;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.85);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
    }

    .brand { min-width: 9rem; }

    .brand-link {
      display: inline-block;
      margin: 0;
      font-size: clamp(1.2rem, 2.2vw, 1.6rem);
      font-weight: 700;
      color: #0f172a;
      text-decoration: none;
      letter-spacing: -0.02em;
    }

    .brand-link:hover {
      color: #1d4ed8;
    }

    .brand-link.active {
      color: #1d4ed8;
    }

    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      justify-content: center;
    }

    .nav-link {
      padding: 0.55rem 0.85rem;
      border-radius: 0.75rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      text-decoration: none;
      font-size: 0.92rem;
      white-space: nowrap;
    }

    .nav-link.active {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
      box-shadow: 0 0 0 1px #2563eb inset;
    }

    .logout {
      padding: 0.6rem 0.9rem;
      border-radius: 0.8rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      white-space: nowrap;
    }

    @media (max-width: 900px) {
      .topbar {
        grid-template-columns: 1fr;
        justify-items: stretch;
      }

      .nav { justify-content: flex-start; }
    }
  `]
})
export class AppTopbarComponent {
  auth = inject(AuthFacadeService);
  private router = inject(Router);

  // Zentrale Liste: hier lassen sich Bereiche später leicht ergänzen oder umbenennen.
  readonly navItems: DashboardNavItem[] = [
    { label: 'Übersicht', fragment: 'overview' },
    { label: 'Routenplanung', fragment: 'planner' },
    { label: 'Touren & Logs', fragment: 'tours' },
    { label: 'Import/Export', fragment: 'import' },
  ];

  // Die Topbar hängt nicht an der Dashboard-Route, deshalb Fragment direkt aus der Router-URL lesen.
  activeFragment = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.readFragment()),
      startWith(this.readFragment()),
    ),
    { initialValue: 'overview' },
  );

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }

  private readFragment(): string {
    return this.router.parseUrl(this.router.url).fragment || 'overview';
  }
}
