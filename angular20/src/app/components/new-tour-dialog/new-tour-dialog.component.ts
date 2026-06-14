import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DashboardFacadeService, TourDraft } from '../../core/services/dashboard-facade.service';

@Component({
  selector: 'app-new-tour-dialog',
  standalone: true,
  imports: [NgIf, FormsModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="dialog-title">
      <mat-icon fontSet="material-icons-outlined">post_add</mat-icon>
      <h2>Neue Tour anlegen</h2>
    </div>

    <div mat-dialog-content class="dialog-content">
      <p class="lede">Gib die wichtigsten Infos ein. Details kannst du danach noch bearbeiten.</p>

      <div class="form-grid">
        <label class="full">
          <span>Name *</span>
          <input class="input" [(ngModel)]="draft.name" type="text" placeholder="z. B. Alpenüberquerung" autofocus />
        </label>
        <label>
          <span>Von</span>
          <input class="input" [(ngModel)]="draft.from" type="text" placeholder="Startort" />
        </label>
        <label>
          <span>Nach</span>
          <input class="input" [(ngModel)]="draft.to" type="text" placeholder="Zielort" />
        </label>
        <label>
          <span>Transport</span>
          <input class="input" [(ngModel)]="draft.transportType" type="text" />
        </label>
        <label>
          <span>Distanz (km)</span>
          <input class="input" [(ngModel)]="draft.distanceKm" type="number" step="0.1" min="0" />
        </label>
        <label>
          <span>Minuten</span>
          <input class="input" [(ngModel)]="draft.estimatedTimeMinutes" type="number" min="0" />
        </label>
        <label class="full">
          <span>Bild</span>
          <input class="input" [(ngModel)]="draft.image" type="text" placeholder="https://... oder hochgeladener Pfad" />
          <input class="input file" type="file" accept="image/*" (change)="uploadImage($event)" />
        </label>
        <label class="full">
          <span>Beschreibung</span>
          <textarea class="input area" [(ngModel)]="draft.description" placeholder="Optional"></textarea>
        </label>
      </div>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
    </div>

    <div mat-dialog-actions align="end" class="dialog-actions">
      <button mat-stroked-button type="button" (click)="close()" [disabled]="saving">Abbrechen</button>
      <button mat-flat-button color="primary" type="button" (click)="save()" [disabled]="!canSave || saving">
        <mat-icon fontSet="material-icons-outlined">check</mat-icon>
        Tour anlegen
      </button>
    </div>
  `,
  styles: [`
    .dialog-title { display:flex; align-items:center; gap:.6rem; padding:1.25rem 1.5rem 0; }
    .dialog-title h2 { margin:0; font-size:1.35rem; }
    .dialog-content { padding-top:.5rem !important; }
    .lede { margin:0 0 1rem; color:#475569; }
    .form-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:.75rem; }
    .form-grid label { display:grid; gap:.35rem; color:#334155; }
    .full { grid-column: 1 / -1; }
    .input { width:100%; padding:.75rem .9rem; border:1px solid #cbd5e1; border-radius:.75rem; box-sizing:border-box; }
    .file { padding:.6rem .9rem; background:#f8fafc; }
    .area { min-height: 5rem; resize: vertical; }
    .error { margin:.75rem 0 0; color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; padding:.65rem .8rem; border-radius:.75rem; }
    .dialog-actions { padding: .5rem 1rem 1rem; gap:.5rem; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class NewTourDialogComponent {
  private dialogRef = inject(MatDialogRef<NewTourDialogComponent>);
  private facade = inject(DashboardFacadeService);

  draft: TourDraft = {
    name: '',
    description: '',
    image: '',
    from: '',
    to: '',
    transportType: 'walking',
    distanceKm: 0,
    estimatedTimeMinutes: 0,
  };
  saving = false;
  errorMessage = '';

  get canSave(): boolean {
    return this.draft.name.trim().length > 0;
  }

  close(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    if (!this.canSave || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    try {
      await this.facade.createTourFromDraft(this.draft);
      this.dialogRef.close(true);
    } catch {
      this.errorMessage = 'Tour konnte nicht angelegt werden. Bitte versuche es erneut.';
    } finally {
      this.saving = false;
    }
  }

  async uploadImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      this.draft.image = await this.facade.uploadTourImage(file);
    } catch {
      this.errorMessage = 'Bild konnte nicht hochgeladen werden.';
    } finally {
      input.value = '';
    }
  }
}
