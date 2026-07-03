import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { EditTourDialogComponent } from '../../components/edit-tour-dialog/edit-tour-dialog.component';
import { NewTourDialogComponent } from '../../components/new-tour-dialog/new-tour-dialog.component';
import { DashboardFacadeService } from '../../core/services/dashboard-facade.service';
import { TourSearchItemDto } from '../../core/models/dashboard.types';
import { Co2BadgeComponent } from '../../shared/components/co2-badge/co2-badge.component';
import { TourResponse } from '../../swagger';

@Component({
  selector: 'app-dashboard-tour-explorer',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, MatButtonModule, MatIconModule, Co2BadgeComponent],
  template: `
    <section class="panel">
      <div class="panel-title-row">
        <div>
          <p class="panel-kicker">Tours</p>
          <h3>Touren verwalten</h3>
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="facade.refreshTours()">Refresh</button>
          <button mat-flat-button color="primary" (click)="openNewTourDialog()">
            <mat-icon fontSet="material-icons-outlined">post_add</mat-icon>
            Neue Tour
          </button>
        </div>
      </div>

      <label class="search-row">
        <mat-icon fontSet="material-icons-outlined" class="search-icon">search</mat-icon>
        <input
          class="input search-input"
          type="search"
          [(ngModel)]="facade.searchTerm"
          (ngModelChange)="onSearchChange()"
          placeholder="Touren durchsuchen..."
        />
        <button
          *ngIf="facade.searchTerm"
          type="button"
          mat-icon-button
          class="search-clear"
          aria-label="Suche löschen"
          (click)="clearSearch()"
        >
          <mat-icon fontSet="material-icons-outlined">close</mat-icon>
        </button>
      </label>

      <p class="message" *ngIf="facade.actionMessage">{{ facade.actionMessage }}</p>

      <div class="tour-list-section">
        <div class="list-header">
          <h4>{{ facade.isSearching ? 'Suchergebnisse' : 'Alle Touren' }}</h4>
          <span class="count" *ngIf="!facade.loadingTours && !facade.loadingSearch">
            {{ facade.displayedTours.length }}
          </span>
        </div>

        <div class="list" *ngIf="!facade.loadingTours && !facade.loadingSearch; else loadingTours">
          <div
            class="list-item"
            *ngFor="let tour of facade.displayedTours"
            [class.active]="tour.id === facade.editingTourId"
          >
            <div class="list-item-content">
              <strong>{{ tour.name }}</strong>
              <small>{{ tour.from || '?' }} → {{ tour.to || '?' }}</small>
              <app-co2-badge
                *ngIf="tour.distanceKm"
                [distanceKm]="tour.distanceKm!"
                [transportType]="tour.transportType || 'walking'"
              />
              <small class="match" *ngIf="facade.isSearching && asSearchItem(tour)?.matchSummary">
                {{ asSearchItem(tour)?.matchSummary }}
              </small>
            </div>
            <div class="list-item-actions">
              <button mat-stroked-button type="button" (click)="openEditTourDialog(tour.id)">
                <mat-icon fontSet="material-icons-outlined">edit</mat-icon>
                Ändern
              </button>
              <button
                mat-icon-button
                type="button"
                class="list-item-delete"
                aria-label="Tour löschen"
                (click)="deleteTour($event, tour.id)"
              >
                <mat-icon fontSet="material-icons-outlined">delete</mat-icon>
              </button>
            </div>
          </div>

          <p class="muted empty-list" *ngIf="facade.displayedTours.length === 0">
            {{ facade.isSearching ? 'Keine passenden Touren gefunden.' : 'Noch keine Touren vorhanden.' }}
          </p>
        </div>

        <ng-template #loadingTours>
          <p class="muted">Touren werden geladen...</p>
        </ng-template>
      </div>
    </section>
  `,
  styles: [`
    .panel { padding: 1.1rem 1.2rem; border-radius: 1rem; border: 1px solid #dbe2ea; background: rgba(255,255,255,0.85); box-shadow: 0 18px 40px rgba(15,23,42,0.05); }
    .panel-title-row { display:flex; justify-content:space-between; align-items:end; gap:1rem; margin-bottom:1rem; }
    .panel-kicker { margin:0 0 .2rem; text-transform:uppercase; letter-spacing:.14em; font-size:.72rem; color:#64748b; }
    h3, h4 { margin:0; }
    .actions { display:flex; flex-wrap:wrap; gap:.75rem; }
    .search-row { display:flex; align-items:center; gap:.5rem; margin-bottom:1rem; }
    .search-icon { color:#64748b; flex-shrink:0; }
    .search-input { flex:1; margin:0; }
    .search-clear { flex-shrink:0; color:#64748b; }
    .tour-list-section { margin-bottom:0; }
    .list-header { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:.75rem; }
    .count { font-size:.85rem; color:#64748b; background:#f1f5f9; padding:.2rem .55rem; border-radius:999px; }
    .list { display:grid; gap:.5rem; }
    .list-item { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.75rem .9rem; border:1px solid #cbd5e1; border-radius:.85rem; background:#fff; }
    .list-item.active { border-color:#2563eb; background:#eff6ff; box-shadow:0 0 0 1px #2563eb inset, 0 8px 18px rgba(37,99,235,0.12); }
    .list-item-content { display:grid; gap:.1rem; min-width:0; }
    .list-item-content strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .match { color:#0369a1; }
    .list-item-actions { display:flex; align-items:center; gap:.25rem; flex-shrink:0; }
    .list-item-delete { color:#94a3b8; }
    .list-item-delete:hover { color:#dc2626; background:#fef2f2; }
    .empty-list { margin:.25rem 0 0; }
    .message { margin:.25rem 0 .75rem; color:#0369a1; }
    .muted { color:#64748b; }
    .input { width:100%; padding:.8rem .95rem; border:1px solid #cbd5e1; border-radius:.75rem; box-sizing:border-box; }
    @media (max-width: 720px) {
      .list-item { flex-direction:column; align-items:stretch; }
      .list-item-actions { justify-content:flex-end; }
    }
  `]
})
export class DashboardTourExplorerComponent {
  facade = inject(DashboardFacadeService);
  private dialog = inject(MatDialog);
  private searchTimeout?: ReturnType<typeof setTimeout>;

  openNewTourDialog(): void {
    this.dialog.open(NewTourDialogComponent, {
      width: '42rem',
      maxWidth: '96vw',
      autoFocus: 'input',
    });
  }

  async openEditTourDialog(id?: number): Promise<void> {
    if (id == null) {
      return;
    }

    await this.facade.editTour(id);

    const ref = this.dialog.open(EditTourDialogComponent, {
      width: '56rem',
      maxWidth: '96vw',
      maxHeight: '90vh',
      autoFocus: 'input',
    });

    ref.afterClosed().subscribe(() => this.facade.closeTourEditor());
  }

  asSearchItem(tour: TourResponse | TourSearchItemDto): TourSearchItemDto | null {
    return 'matchSummary' in tour ? tour : null;
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      void this.facade.applySearch();
    }, 300);
  }

  clearSearch(): void {
    this.facade.searchTerm = '';
    this.facade.searchResults = [];
  }

  async deleteTour(event: Event, id?: number): Promise<void> {
    event.stopPropagation();
    if (id == null) {
      return;
    }

    await this.facade.deleteTourById(id);
  }
}
