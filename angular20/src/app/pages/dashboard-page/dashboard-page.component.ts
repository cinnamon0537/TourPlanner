import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardFacadeService } from '../../core/services/dashboard-facade.service';
import { DashboardTourExplorerComponent } from '../../test-pages/test-general/dashboard-tour-explorer.component';
import { DashboardRoutePlannerComponent } from '../../test-pages/test-general/dashboard-route-planner.component';
import { DashboardImportExportComponent } from '../../test-pages/test-general/dashboard-import-export.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, DashboardTourExplorerComponent, DashboardRoutePlannerComponent, DashboardImportExportComponent],
  template: `
    <section class="intro">
      <div>
        <p class="eyebrow">Protected dashboard</p>
        <h2>Manage tours, routes, logs, and data</h2>
        <p>Use the logout button in the header to return to the login screen.</p>
      </div>
      <div class="stats">
        <div><strong>{{ facade.tours.length }}</strong><span>Tours</span></div>
        <div><strong>{{ facade.logs.length }}</strong><span>Logs</span></div>
        <div><strong>{{ facade.searchResults.length }}</strong><span>Search hits</span></div>
      </div>
    </section>

    <div class="grid">
      <app-dashboard-route-planner />
      <app-dashboard-tour-explorer />
      <app-dashboard-import-export />
    </div>
  `,
  styles: [`
    :host { display:grid; gap:1rem; }
    .intro { display:flex; justify-content:space-between; gap:1rem; align-items:end; padding:1.1rem 1.2rem; border-radius:1rem; border:1px solid #dbe2ea; background:rgba(255,255,255,0.85); box-shadow:0 18px 40px rgba(15,23,42,0.05); }
    .eyebrow { margin:0 0 .3rem; text-transform:uppercase; letter-spacing:.14em; font-size:.72rem; color:#64748b; }
    h2 { margin:0; font-size:clamp(1.5rem, 3vw, 2.2rem); }
    p { margin:.6rem 0 0; color:#475569; }
    .stats { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:.75rem; min-width:min(24rem, 100%); }
    .stats div { display:grid; gap:.2rem; padding:.75rem .85rem; border-radius:.85rem; background:linear-gradient(180deg,#f8fafc,#fff); }
    .stats strong { font-size:1.4rem; }
    .stats span { color:#64748b; font-size:.9rem; }
    .grid { display:grid; gap:1rem; }
    @media (max-width: 900px) { .intro { flex-direction:column; align-items:stretch; } .stats { min-width:0; } }
  `]
})
export class DashboardPageComponent implements OnInit {
  facade = inject(DashboardFacadeService);

  async ngOnInit(): Promise<void> {
    await this.facade.bootstrap();
  }
}
