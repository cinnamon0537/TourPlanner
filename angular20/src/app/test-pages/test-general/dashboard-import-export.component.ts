import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DashboardFacadeService } from '../../core/services/dashboard-facade.service';

@Component({
  selector: 'app-dashboard-import-export',
  standalone: true,
  imports: [FormsModule, NgIf, MatButtonModule],
  template: `
    <section class="panel">
      <div class="panel-title-row">
        <div>
          <p class="panel-kicker">Data</p>
          <h3>Import and export</h3>
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="facade.useSampleImport()">Sample import</button>
          <button mat-flat-button color="primary" (click)="facade.exportTours()">Export tours</button>
          <button mat-flat-button color="primary" (click)="facade.importTours()">Import tours</button>
        </div>
      </div>

      <p class="message" *ngIf="facade.exportMessage">{{ facade.exportMessage }}</p>
      <textarea class="box" [value]="facade.exportJson" readonly></textarea>

      <p class="message" *ngIf="facade.importMessage">{{ facade.importMessage }}</p>
      <textarea class="box" [(ngModel)]="facade.importJson" placeholder="Paste import JSON here"></textarea>
    </section>
  `,
  styles: [`
    .panel { padding: 1.1rem 1.2rem; border-radius: 1rem; border: 1px solid #dbe2ea; background: rgba(255,255,255,0.85); box-shadow: 0 18px 40px rgba(15,23,42,0.05); }
    .panel-title-row { display:flex; justify-content:space-between; align-items:end; gap:1rem; margin-bottom:1rem; }
    .panel-kicker { margin:0 0 .2rem; text-transform:uppercase; letter-spacing:.14em; font-size:.72rem; color:#64748b; }
    h3 { margin:0; }
    .actions { display:flex; flex-wrap:wrap; gap:.5rem; }
    .box { width:100%; min-height: 10rem; margin-top: .75rem; padding:.8rem .9rem; border:1px solid #cbd5e1; border-radius:.85rem; background:#fff; font-family: monospace; }
    .message { margin:.5rem 0 0; color:#0369a1; }
  `]
})
export class DashboardImportExportComponent {
  facade = inject(DashboardFacadeService);
}
