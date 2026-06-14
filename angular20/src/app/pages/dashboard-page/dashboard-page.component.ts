import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DashboardFacadeService } from '../../core/services/dashboard-facade.service';
import { DashboardTourExplorerComponent } from '../../test-pages/test-general/dashboard-tour-explorer.component';
import { DashboardRoutePlannerComponent } from '../../test-pages/test-general/dashboard-route-planner.component';
import { DashboardImportExportComponent } from '../../test-pages/test-general/dashboard-import-export.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    DashboardTourExplorerComponent,
    DashboardRoutePlannerComponent,
    DashboardImportExportComponent,
  ],
  template: `
    @switch (activeSection()) {
      @case ('planner') {
        <app-dashboard-route-planner />
      }
      @case ('tours') {
        <app-dashboard-tour-explorer />
      }
      @case ('import') {
        <app-dashboard-import-export />
      }
      @default {
        <section class="intro">
          <div>
            <p class="eyebrow">Start</p>
            <h2>Willkommen im TourPlanner</h2>
            <p>
              Die Navigation oben führt zu den Hauptbereichen der Anwendung.
              Jeder Bereich hat eine klar abgegrenzte Aufgabe.
            </p>
          </div>
          <div class="stats">
            <div><strong>{{ facade.tours.length }}</strong><span>Touren</span></div>
            <div><strong>{{ facade.logs.length }}</strong><span>Logs</span></div>
            <div><strong>{{ facade.searchResults.length }}</strong><span>Suchtreffer</span></div>
          </div>
        </section>

        <section class="overview-grid">
          <article class="overview-card">
            <h3>Routenplanung</h3>
            <p>Start und Ziel eingeben, Route berechnen und die Karte anzeigen.</p>
          </article>
          <article class="overview-card">
            <h3>Touren & Logs</h3>
            <p>Touren anlegen, bearbeiten, suchen und zugehörige Tour-Logs verwalten.</p>
          </article>
          <article class="overview-card">
            <h3>Import/Export</h3>
            <p>Tour-Daten als JSON exportieren oder aus einer JSON-Datei importieren.</p>
          </article>
        </section>
      }
    }
  `,
  styles: [`
    :host { display: grid; gap: 1rem; }

    .intro {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: end;
      padding: 1.1rem 1.2rem;
      border-radius: 1rem;
      border: 1px solid #dbe2ea;
      background: rgba(255, 255, 255, 0.85);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
    }

    .eyebrow {
      margin: 0 0 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 0.72rem;
      color: #64748b;
    }

    h2 { margin: 0; font-size: clamp(1.5rem, 3vw, 2.2rem); }
    h3 { margin: 0 0 0.45rem; font-size: 1.05rem; }

    p { margin: 0.6rem 0 0; color: #475569; }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.75rem;
      min-width: min(24rem, 100%);
    }

    .stats div {
      display: grid;
      gap: 0.2rem;
      padding: 0.75rem 0.85rem;
      border-radius: 0.85rem;
      background: linear-gradient(180deg, #f8fafc, #fff);
    }

    .stats strong { font-size: 1.4rem; }
    .stats span { color: #64748b; font-size: 0.9rem; }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .overview-card {
      padding: 1rem 1.05rem;
      border: 1px solid #dbe2ea;
      border-radius: 0.95rem;
      background: #fff;
    }

    @media (max-width: 900px) {
      .intro { flex-direction: column; align-items: stretch; }
      .stats { min-width: 0; }
      .overview-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardPageComponent implements OnInit {
  facade = inject(DashboardFacadeService);
  private route = inject(ActivatedRoute);

  // Gleiche Fragment-Logik wie in der Topbar: ein Bereich, eine Ansicht.
  activeSection = toSignal(
    this.route.fragment.pipe(map(fragment => fragment || 'overview')),
    { initialValue: 'overview' },
  );

  async ngOnInit(): Promise<void> {
    await this.facade.bootstrap();
  }
}
