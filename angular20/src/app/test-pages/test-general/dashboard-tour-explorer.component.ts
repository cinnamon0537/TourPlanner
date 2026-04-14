import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DashboardFacadeService } from '../../core/services/dashboard-facade.service';

@Component({
  selector: 'app-dashboard-tour-explorer',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, MatButtonModule],
  template: `
    <section class="panel">
      <div class="panel-title-row">
        <div>
          <p class="panel-kicker">Tours</p>
          <h3>Explore, edit, and delete tours</h3>
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="facade.refreshTours()">Refresh</button>
          <button mat-flat-button color="primary" (click)="facade.newTour()">New tour</button>
        </div>
      </div>

      <div class="search-row">
        <input class="input" type="search" [(ngModel)]="facade.searchTerm" placeholder="Search tours, logs, stats" (keyup.enter)="facade.refreshSearch()" />
        <button mat-flat-button color="primary" (click)="facade.refreshSearch()">Search</button>
      </div>

      <p class="message" *ngIf="facade.actionMessage">{{ facade.actionMessage }}</p>

      <div class="columns">
        <div>
          <h4>Search results</h4>
          <div class="list" *ngIf="!facade.loadingSearch; else loadingSearch">
            <button class="list-item" *ngFor="let tour of facade.searchResults" (click)="facade.selectTour(tour.id)" [class.active]="tour.id === facade.selectedTourId">
              <strong>{{ tour.name }}</strong>
              <small>{{ tour.from || '?' }} → {{ tour.to || '?' }}</small>
              <small>{{ tour.matchSummary }}</small>
            </button>
          </div>
          <ng-template #loadingSearch><p class="muted">Running search...</p></ng-template>
        </div>

        <div>
          <h4>All tours</h4>
          <div class="list" *ngIf="!facade.loadingTours; else loadingTours">
            <button class="list-item" *ngFor="let tour of facade.tours" (click)="facade.selectTour(tour.id)" [class.active]="tour.id === facade.selectedTourId">
              <strong>{{ tour.name }}</strong>
              <small>{{ tour.from || '?' }} → {{ tour.to || '?' }}</small>
            </button>
          </div>
          <ng-template #loadingTours><p class="muted">Loading tours...</p></ng-template>
        </div>
      </div>

      <div class="detail-grid">
        <article class="detail-card">
          <div class="detail-header">
            <h4>Tour details</h4>
            <div class="actions">
              <button mat-stroked-button (click)="facade.loadTourDraftFromSelection()">Reset</button>
              <button mat-flat-button color="primary" (click)="facade.saveTour()">Save tour</button>
              <button mat-stroked-button color="warn" (click)="facade.deleteTour()" [disabled]="!facade.tourDraft.id">Delete</button>
            </div>
          </div>

          <div class="form-grid">
            <label><span>Name</span><input class="input" [(ngModel)]="facade.tourDraft.name" type="text" /></label>
            <label class="full"><span>Image</span><input class="input" [(ngModel)]="facade.tourDraft.image" type="text" placeholder="https://... or uploaded path" /><input class="input file" type="file" accept="image/*" (change)="uploadImage($event)" /></label>
            <label><span>From</span><input class="input" [(ngModel)]="facade.tourDraft.from" type="text" /></label>
            <label><span>To</span><input class="input" [(ngModel)]="facade.tourDraft.to" type="text" /></label>
            <label><span>Transport</span><input class="input" [(ngModel)]="facade.tourDraft.transportType" type="text" /></label>
            <label><span>Distance km</span><input class="input" [(ngModel)]="facade.tourDraft.distanceKm" type="number" step="0.1" min="0" /></label>
            <label><span>Minutes</span><input class="input" [(ngModel)]="facade.tourDraft.estimatedTimeMinutes" type="number" min="0" /></label>
            <label class="full"><span>Description</span><textarea class="input area" [(ngModel)]="facade.tourDraft.description"></textarea></label>
          </div>

          <div class="preview" *ngIf="facade.tourDraft.image; else noImage">
            <img [src]="facade.tourDraft.image" [alt]="facade.tourDraft.name || 'tour image'" />
          </div>
          <ng-template #noImage>
            <div class="preview empty">No image set yet.</div>
          </ng-template>
        </article>

        <article class="detail-card">
          <div class="detail-header">
            <h4>Tour logs</h4>
            <div class="actions" *ngIf="facade.hasSelectedTour">
              <button mat-stroked-button (click)="facade.newLog()">Create new log</button>
              <button mat-flat-button color="primary" (click)="facade.saveLog()">{{ facade.logDraft.id ? 'Update log' : 'Save log' }}</button>
              <button mat-stroked-button color="warn" (click)="facade.deleteLog()" [disabled]="!facade.logDraft.id">Delete</button>
            </div>
          </div>

          <p class="hint" *ngIf="!facade.hasSelectedTour">Select a tour first to view or create logs.</p>
          <p class="message log-message" *ngIf="facade.logMessage">{{ facade.logMessage }}</p>

          <div class="list compact" *ngIf="!facade.loadingLogs; else loadingLogs">
            <button class="list-item" *ngFor="let log of facade.logs" (click)="facade.selectLog(log.id)" [class.active]="log.id === facade.selectedLogId">
              <strong>{{ log.comment || 'No comment' }}</strong>
              <small>{{ log.difficulty }} | {{ log.totalDistanceKm }} km | {{ log.totalTimeMinutes }} min | rating {{ log.rating ?? '-' }}</small>
            </button>
          </div>
          <ng-template #loadingLogs><p class="muted">Loading logs...</p></ng-template>

          <ng-template #logSelectionPrompt>
            <div class="hint">Select a tour first to create or edit logs.</div>
          </ng-template>

          <div class="form-grid log-form" *ngIf="facade.hasSelectedTour; else logSelectionPrompt">
            <label><span>Date/time</span><input class="input" [(ngModel)]="facade.logDraft.logDateTime" type="datetime-local" /></label>
            <label><span>Difficulty</span><input class="input" [(ngModel)]="facade.logDraft.difficulty" type="text" /></label>
            <label><span>Distance km</span><input class="input" [(ngModel)]="facade.logDraft.totalDistanceKm" type="number" step="0.1" min="0" /></label>
            <label><span>Minutes</span><input class="input" [(ngModel)]="facade.logDraft.totalTimeMinutes" type="number" min="1" /></label>
            <label><span>Rating</span><input class="input" [(ngModel)]="facade.logDraft.rating" type="number" min="1" max="5" /></label>
            <label class="full"><span>Comment</span><textarea class="input area" [(ngModel)]="facade.logDraft.comment"></textarea></label>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .panel { padding: 1.1rem 1.2rem; border-radius: 1rem; border: 1px solid #dbe2ea; background: rgba(255,255,255,0.85); box-shadow: 0 18px 40px rgba(15,23,42,0.05); }
    .panel-title-row, .detail-header { display:flex; justify-content:space-between; align-items:end; gap:1rem; margin-bottom:1rem; }
    .panel-kicker { margin:0 0 .2rem; text-transform:uppercase; letter-spacing:.14em; font-size:.72rem; color:#64748b; }
    h3, h4 { margin:0; }
    .search-row, .actions { display:flex; flex-wrap:wrap; gap:.75rem; }
    .search-row { margin-bottom:.85rem; }
    .columns { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; margin-bottom: 1rem; }
    .detail-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; }
    .detail-card { padding: .95rem 1rem; border:1px solid #dbe2ea; border-radius: .95rem; background:#fff; display:grid; gap: .9rem; }
    .list { display:grid; gap:.5rem; }
    .list.compact { max-height: 13rem; overflow:auto; padding-right:.25rem; }
    .list-item { display:grid; gap:.1rem; text-align:left; padding:.8rem .9rem; border:1px solid #cbd5e1; border-radius:.85rem; background:#fff; }
    .list-item.active { border-color:#2563eb; background:#eff6ff; box-shadow:0 0 0 1px #2563eb inset, 0 8px 18px rgba(37,99,235,0.12); }
    .message { margin:.25rem 0 .75rem; color:#0369a1; }
    .muted { color:#64748b; }
    .hint { margin:0; padding:.7rem .85rem; border-radius:.75rem; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; }
    .form-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:.75rem; }
    .form-grid label { display:grid; gap:.35rem; color:#334155; }
    .full { grid-column: 1 / -1; }
    .input { width:100%; padding:.8rem .95rem; border:1px solid #cbd5e1; border-radius:.75rem; }
    .file { padding:.65rem .95rem; background:#f8fafc; }
    .area { min-height: 5.8rem; resize: vertical; }
    .preview { min-height: 12rem; border:1px dashed #cbd5e1; border-radius:.9rem; overflow:hidden; display:grid; place-items:center; background:#f8fafc; }
    .preview img { width:100%; height:100%; object-fit:cover; }
    .preview.empty { color:#64748b; }
    .log-form { margin-top:.25rem; }
    @media (max-width: 1100px) { .columns, .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardTourExplorerComponent {
  facade = inject(DashboardFacadeService);

  async uploadImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    await this.facade.uploadTourImage(file);
    input.value = '';
  }
}
