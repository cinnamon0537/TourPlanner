import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardFacadeService } from '../../core/services/dashboard-facade.service';

@Component({
  selector: 'app-edit-tour-dialog',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatTabsModule],
  template: `
    <div class="dialog-title">
      <mat-icon fontSet="material-icons-outlined">edit</mat-icon>
      <div>
        <h2>Tour bearbeiten</h2>
        <p class="subtitle">{{ facade.tourDraft.name || 'Tour' }}</p>
      </div>
    </div>

    <div mat-dialog-content class="dialog-content">
      <mat-tab-group animationDuration="200ms" class="tour-tabs">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon fontSet="material-icons-outlined" class="tab-icon">route</mat-icon>
            Tour Details
          </ng-template>

          <div class="tab-panel">
            <div class="form-grid">
              <label><span>Name</span><input class="input" [(ngModel)]="facade.tourDraft.name" type="text" /></label>
              <label class="full">
                <span>Image</span>
                <input class="input" [(ngModel)]="facade.tourDraft.image" type="text" placeholder="https://... or uploaded path" />
                <input class="input file" type="file" accept="image/*" (change)="uploadImage($event)" />
              </label>
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

            <div class="tab-footer-actions">
              <button mat-stroked-button type="button" (click)="facade.loadTourDraftFromSelection()">Reset</button>
              <button mat-flat-button color="primary" type="button" (click)="saveTour()" [disabled]="savingTour">
                <mat-icon fontSet="material-icons-outlined">check</mat-icon>
                Speichern
              </button>
            </div>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon fontSet="material-icons-outlined" class="tab-icon">history</mat-icon>
            Logs
            <span class="tab-badge" *ngIf="facade.logs.length">{{ facade.logs.length }}</span>
          </ng-template>

          <div class="tab-panel">
            <div class="tab-toolbar">
              <button mat-flat-button color="primary" type="button" (click)="facade.newLog()">
                <mat-icon fontSet="material-icons-outlined">post_add</mat-icon>
                Neuer Log
              </button>
            </div>

            <p class="message" *ngIf="facade.logMessage">{{ facade.logMessage }}</p>

            <div class="log-list" *ngIf="!facade.loadingLogs; else loadingLogs">
              <div
                class="log-list-item"
                *ngFor="let log of facade.logs"
                [class.active]="log.id === facade.selectedLogId"
              >
                <div class="log-list-content">
                  <strong>{{ log.comment || 'No comment' }}</strong>
                  <small>{{ log.difficulty }} | {{ log.totalDistanceKm }} km | {{ log.totalTimeMinutes }} min | rating {{ log.rating ?? '-' }}</small>
                </div>
                <div class="log-list-actions">
                  <button mat-stroked-button type="button" (click)="facade.selectLog(log.id)">
                    <mat-icon fontSet="material-icons-outlined">edit</mat-icon>
                    Ändern
                  </button>
                  <button
                    mat-icon-button
                    type="button"
                    class="icon-delete"
                    aria-label="Log löschen"
                    (click)="deleteLog($event, log.id)"
                  >
                    <mat-icon fontSet="material-icons-outlined">delete</mat-icon>
                  </button>
                </div>
              </div>
              <p class="muted" *ngIf="facade.logs.length === 0">Noch keine Logs für diese Tour.</p>
            </div>
            <ng-template #loadingLogs><p class="muted">Loading logs...</p></ng-template>

            <div class="form-grid log-form">
              <label><span>Date/time</span><input class="input" [(ngModel)]="facade.logDraft.logDateTime" type="datetime-local" /></label>
              <label><span>Difficulty</span><input class="input" [(ngModel)]="facade.logDraft.difficulty" type="text" /></label>
              <label><span>Distance km</span><input class="input" [(ngModel)]="facade.logDraft.totalDistanceKm" type="number" step="0.1" min="0" /></label>
              <label><span>Minutes</span><input class="input" [(ngModel)]="facade.logDraft.totalTimeMinutes" type="number" min="1" /></label>
              <label><span>Rating</span><input class="input" [(ngModel)]="facade.logDraft.rating" type="number" min="1" max="5" /></label>
              <label class="full"><span>Comment</span><textarea class="input area" [(ngModel)]="facade.logDraft.comment"></textarea></label>
            </div>

            <div class="tab-footer-actions">
              <button mat-flat-button color="primary" type="button" (click)="saveLog()" [disabled]="savingLog">
                <mat-icon fontSet="material-icons-outlined">check</mat-icon>
                {{ facade.logDraft.id ? 'Log speichern' : 'Log anlegen' }}
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>

    <div mat-dialog-actions align="end" class="dialog-actions">
      <button mat-stroked-button type="button" (click)="close()">Schließen</button>
    </div>
  `,
  styles: [`
    .dialog-title { display:flex; align-items:flex-start; gap:.75rem; padding:1.25rem 1.5rem 0; }
    .dialog-title h2 { margin:0; font-size:1.35rem; }
    .subtitle { margin:.15rem 0 0; color:#64748b; font-size:.92rem; }
    .dialog-content { padding-top:.5rem !important; }
    .tour-tabs { margin-top:.25rem; }
    .tab-icon { margin-right:.35rem; font-size:1.1rem; width:1.1rem; height:1.1rem; }
    .tab-badge { margin-left:.4rem; font-size:.75rem; line-height:1.4; padding:0 .45rem; border-radius:999px; background:#e2e8f0; color:#475569; }
    .tab-panel { display:grid; gap:.85rem; padding:1rem 0 .25rem; }
    .tab-toolbar { display:flex; justify-content:flex-end; }
    .tab-footer-actions { display:flex; justify-content:flex-end; flex-wrap:wrap; gap:.5rem; padding-top:.25rem; border-top:1px solid #e2e8f0; }
    .form-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:.75rem; }
    .form-grid label { display:grid; gap:.35rem; color:#334155; }
    .full { grid-column: 1 / -1; }
    .input { width:100%; padding:.75rem .9rem; border:1px solid #cbd5e1; border-radius:.75rem; box-sizing:border-box; background:#fff; }
    .file { padding:.6rem .9rem; background:#fff; }
    .area { min-height: 4.5rem; resize: vertical; }
    .preview { min-height: 10rem; border:1px dashed #cbd5e1; border-radius:.9rem; overflow:hidden; display:grid; place-items:center; background:#f8fafc; }
    .preview img { width:100%; height:100%; object-fit:cover; }
    .preview.empty { color:#64748b; }
    .log-list { display:grid; gap:.5rem; }
    .log-list-item { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.75rem .85rem; border:1px solid #cbd5e1; border-radius:.85rem; background:#fff; }
    .log-list-item.active { border-color:#2563eb; background:#eff6ff; box-shadow:0 0 0 1px #2563eb inset; }
    .log-list-content { display:grid; gap:.1rem; min-width:0; }
    .log-list-actions { display:flex; align-items:center; gap:.25rem; flex-shrink:0; }
    .icon-delete { color:#94a3b8; }
    .icon-delete:hover { color:#dc2626; background:#fef2f2; }
    .message { margin:0; color:#0369a1; }
    .muted { margin:0; color:#64748b; }
    .log-form { margin-top:.15rem; }
    .dialog-actions { padding:.5rem 1rem 1rem; }
    @media (max-width: 720px) {
      .form-grid { grid-template-columns: 1fr; }
      .log-list-item { flex-direction:column; align-items:stretch; }
      .log-list-actions { justify-content:flex-end; }
    }
  `]
})
export class EditTourDialogComponent {
  private dialogRef = inject(MatDialogRef<EditTourDialogComponent>);
  facade = inject(DashboardFacadeService);
  savingTour = false;
  savingLog = false;

  close(): void {
    this.dialogRef.close();
  }

  async saveTour(): Promise<void> {
    this.savingTour = true;
    try {
      await this.facade.saveTour();
    } finally {
      this.savingTour = false;
    }
  }

  async saveLog(): Promise<void> {
    this.savingLog = true;
    try {
      await this.facade.saveLog();
    } finally {
      this.savingLog = false;
    }
  }

  async deleteLog(event: Event, logId?: number): Promise<void> {
    event.stopPropagation();
    if (logId == null) {
      return;
    }

    await this.facade.deleteLogById(logId);
  }

  async uploadImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.facade.tourDraft.image = await this.facade.uploadTourImage(file);
    input.value = '';
  }
}
