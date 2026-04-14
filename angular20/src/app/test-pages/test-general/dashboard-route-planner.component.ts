import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import * as L from 'leaflet';
import { MatButtonModule } from '@angular/material/button';
import { DashboardFacadeService } from '../../core/services/dashboard-facade.service';
import { TourRoutePointDto } from '../../core/models/dashboard.types';

@Component({
  selector: 'app-dashboard-route-planner',
  standalone: true,
  imports: [FormsModule, NgIf, MatButtonModule],
  template: `
    <section class="panel">
      <div class="panel-title-row">
        <div>
          <p class="panel-kicker">Planner</p>
          <h3>Route preview</h3>
        </div>
        <button mat-flat-button color="primary" (click)="planAndRender()">Plan route</button>
      </div>

      <div class="planner-grid">
        <label><span>From</span><input class="input" type="text" [(ngModel)]="facade.routeFrom" /></label>
        <label><span>To</span><input class="input" type="text" [(ngModel)]="facade.routeTo" /></label>
        <label><span>Transport</span><input class="input" type="text" [(ngModel)]="facade.routeTransportType" /></label>
      </div>

      <p class="message" *ngIf="facade.routeLoading">Planning route...</p>
      <p class="message" *ngIf="!facade.routeLoading">{{ facade.routeMessage }}</p>

      <div class="map-shell">
        <div #mapHost class="map-host"></div>
        <div class="meta" *ngIf="facade.plannedRoute">
          <div><strong>Distance:</strong> {{ facade.plannedRoute.distanceKm }} km</div>
          <div><strong>Time:</strong> {{ facade.plannedRoute.estimatedTimeMinutes }} min</div>
          <div><strong>Source:</strong> {{ facade.plannedRoute.source }}</div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .panel { padding: 1.1rem 1.2rem; border-radius: 1rem; border: 1px solid #dbe2ea; background: rgba(255,255,255,0.85); box-shadow: 0 18px 40px rgba(15,23,42,0.05); }
    .panel-title-row { display:flex; justify-content:space-between; align-items:end; gap:1rem; margin-bottom:1rem; }
    .panel-kicker { margin:0 0 .2rem; text-transform:uppercase; letter-spacing:.14em; font-size:.72rem; color:#64748b; }
    h3 { margin:0; }
    .planner-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap:.75rem; }
    label { display:grid; gap:.35rem; color:#334155; }
    .input { padding:.8rem .95rem; border:1px solid #cbd5e1; border-radius:.75rem; }
    .map-shell { display:grid; gap:.65rem; margin-top: .9rem; }
    .map-host { min-height: 320px; border:1px solid #cbd5e1; border-radius: .9rem; overflow:hidden; }
    .meta { display:flex; flex-wrap:wrap; gap:1rem; color:#334155; }
    .message { margin:.5rem 0 0; color:#0369a1; }
  `]
})
export class DashboardRoutePlannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapHost') mapHost?: ElementRef<HTMLDivElement>;

  facade = inject(DashboardFacadeService);
  private map?: L.Map;
  private layer?: L.Polyline;

  async ngAfterViewInit(): Promise<void> {
    queueMicrotask(() => void this.planAndRender());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  async planAndRender(): Promise<void> {
    await this.facade.planRoute();
    this.renderMap();
  }

  private renderMap(): void {
    if (!this.mapHost) return;

    if (!this.map) {
      this.map = L.map(this.mapHost.nativeElement, { zoomControl: true }).setView([48.2, 16.37], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(this.map);
    }

    this.layer?.remove();
    const geometry = this.facade.plannedRoute?.geometry ?? [];
    if (!geometry.length) return;

    const latLngs = geometry.map((point: TourRoutePointDto) => [point.latitude, point.longitude] as [number, number]);
    this.layer = L.polyline(latLngs, { color: '#2563eb', weight: 5 }).addTo(this.map);
    this.map.fitBounds(this.layer.getBounds(), { padding: [24, 24] });
  }
}
