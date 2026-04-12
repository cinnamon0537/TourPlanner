import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as L from 'leaflet';
import { AuthResponse, AuthService, RegisterRequest, OkStatus, TourLogRequest, TourLogResponse, TourLogsService, TourRequest, TourResponse, ToursService, ValuesService } from '../../swagger';
import { version, versionDateString } from '../../shared/version';
import { MatButtonModule } from '@angular/material/button';
import { ApiSessionService } from '../../shared/api-session.service';
import { environment } from '../../../environments/environment';

interface TourSearchResponse {
  id?: number;
  userId?: number;
  name?: string | null;
  description?: string | null;
  from?: string | null;
  to?: string | null;
  transportType?: string | null;
  distanceKm?: number;
  estimatedTimeMinutes?: number;
  createdAt?: string;
  popularity?: number;
  childFriendlinessScore?: number;
  matchSummary?: string | null;
}

interface TourRoutePointResponse {
  latitude: number;
  longitude: number;
}

interface TourPlanResponse {
  from: string;
  to: string;
  transportType: string;
  distanceKm: number;
  estimatedTimeMinutes: number;
  geometry: TourRoutePointResponse[];
  source: string;
}

interface TourExportResponse {
  tours: Array<{
    id: number;
    name: string;
    description?: string | null;
    from?: string | null;
    to?: string | null;
    transportType?: string | null;
    distanceKm: number;
    estimatedTimeMinutes: number;
    createdAt: string;
    logs: Array<{
      logDateTime: string;
      comment?: string | null;
      difficulty: string;
      totalDistanceKm: number;
      totalTimeMinutes: number;
      rating?: number | null;
      createdAt: string;
    }>;
  }>;
}

@Component({
  selector: 'app-test-general',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './test-general.html',
  styleUrl: './test-general.scss'
})
export class TestGeneral implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapHost') mapHost?: ElementRef<HTMLDivElement>;

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toursService = inject(ToursService);
  private tourLogsService = inject(TourLogsService);
  private valuesService = inject(ValuesService);
  private session = inject(ApiSessionService);
  private map?: L.Map;
  private routeLayer?: L.Polyline;
  private readonly demoUser: RegisterRequest = {
    userName: 'frontend-demo',
    email: 'frontend-demo@tourplanner.local',
    password: 'Secret123!',
  };

  okStatus: OkStatus | null = null;
  authMessage = 'Signing in...';
  tours: TourResponse[] = [];
  searchResults: TourSearchResponse[] = [];
  logs: TourLogResponse[] = [];
  selectedTourId: number | null = null;
  loading = false;
  loadingTours = false;
  loadingLogs = false;
  loadingSearch = false;
  routeLoading = false;
  actionMessage = '';
  searchTerm = '';
  routeFrom = 'Vienna';
  routeTo = 'Graz';
  routeTransportType = 'walking';
  routeMessage = 'Plan a route to preview it on the map.';
  plannedRoute: TourPlanResponse | null = null;
  exportMessage = '';
  exportJson = '';
  importJson = '';
  importMessage = '';
  versionString = `v${version} [${versionDateString}]`;

  async ngOnInit(): Promise<void> {
    await this.bootstrap();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.renderMap());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  async bootstrap(): Promise<void> {
    await this.ensureDemoSession();
    this.refreshStatus();
    await this.refreshTours();
    await this.refreshSearch();
    await this.planRoute();
  }

  refreshStatus(): void {
    this.loading = true;
    this.okStatus = null;

    this.valuesService.valuesDummyGet().subscribe({
      next: x => {
        this.okStatus = x;
        this.loading = false;
      },
      error: err => {
        this.okStatus = { isOk: false, val: '', error: err.message };
        this.loading = false;
      },
    });
  }

  async ensureDemoSession(): Promise<void> {
    try {
      const login = await firstValueFrom(this.authService.apiAuthLoginPost({ identifier: this.demoUser.userName, password: this.demoUser.password }));
      this.applySession(login);
      this.authMessage = `Signed in as ${login.userName ?? this.demoUser.userName}`;
      return;
    } catch {
      const registered = await firstValueFrom(this.authService.apiAuthRegisterPost(this.demoUser));
      this.applySession(registered);
      this.authMessage = `Registered and signed in as ${registered.userName ?? this.demoUser.userName}`;
    }
  }

  async refreshTours(): Promise<void> {
    this.loadingTours = true;
    try {
      this.tours = await firstValueFrom(this.toursService.apiToursGet());
      this.selectedTourId ??= this.tours[0]?.id ?? null;
      await this.refreshLogs();
      await this.syncPlannerWithSelection();
    } finally {
      this.loadingTours = false;
    }
  }

  async refreshSearch(): Promise<void> {
    this.loadingSearch = true;
    try {
      const params = this.searchTerm.trim() ? new HttpParams().set('q', this.searchTerm.trim()) : undefined;
      this.searchResults = await firstValueFrom(this.http.get<TourSearchResponse[]>(`${environment.apiRoot}/api/tours/search`, { params }));

      if (this.searchResults.length > 0 && !this.searchResults.some(x => x.id === this.selectedTourId)) {
        this.selectedTourId = this.searchResults[0].id ?? null;
        await this.refreshLogs();
      }

      if (this.searchResults.length === 0) {
        this.logs = [];
      }

      await this.syncPlannerWithSelection();
    } finally {
      this.loadingSearch = false;
    }
  }

  async searchTours(): Promise<void> {
    await this.refreshSearch();
  }

  async refreshLogs(): Promise<void> {
    if (this.selectedTourId == null) {
      this.logs = [];
      return;
    }

    this.loadingLogs = true;
    try {
      this.logs = await firstValueFrom(this.tourLogsService.apiToursTourIdLogsGet(this.selectedTourId));
    } finally {
      this.loadingLogs = false;
    }
  }

  async planRoute(): Promise<void> {
    this.routeLoading = true;
    try {
      this.plannedRoute = await firstValueFrom(this.http.post<TourPlanResponse>(`${environment.apiRoot}/api/tours/plan`, {
        from: this.routeFrom,
        to: this.routeTo,
        transportType: this.routeTransportType,
      }));
      this.routeMessage = `Planned via ${this.plannedRoute.source} with ${this.plannedRoute.distanceKm} km and ${this.plannedRoute.estimatedTimeMinutes} min.`;
      this.routeFrom = this.plannedRoute.from;
      this.routeTo = this.plannedRoute.to;
      this.routeTransportType = this.plannedRoute.transportType;
      this.renderMap();
    } catch (err) {
      this.routeMessage = `Route planning failed: ${(err as Error).message}`;
      this.plannedRoute = null;
      this.renderMap();
    } finally {
      this.routeLoading = false;
    }
  }

  async exportTours(): Promise<void> {
    const exportPayload = await firstValueFrom(this.http.get<TourExportResponse>(`${environment.apiRoot}/api/tours/export`));
    this.exportJson = JSON.stringify(exportPayload, null, 2);
    this.exportMessage = `Exported ${exportPayload.tours.length} tour(s).`;
  }

  async importTours(): Promise<void> {
    if (!this.importJson.trim()) {
      this.importMessage = 'Paste JSON first.';
      return;
    }

    const payload = JSON.parse(this.importJson) as { tours?: unknown[] };
    const response = await firstValueFrom(this.http.post<{ importedTours: number }>(`${environment.apiRoot}/api/tours/import`, payload));
    this.importMessage = `Imported ${response.importedTours} tour(s).`;
    await this.refreshTours();
    await this.refreshSearch();
  }

  useSampleImport(): void {
    this.importJson = JSON.stringify({
      tours: [
        {
          name: 'Imported Sample Tour',
          description: 'Added through the import JSON payload',
          from: 'Wien',
          to: 'St. Pölten',
          transportType: 'walking',
          distanceKm: 42,
          estimatedTimeMinutes: 540,
        },
      ],
    }, null, 2);
  }

  async createTour(): Promise<void> {
    const plan = this.plannedRoute ?? await this.planRouteForCreation();
    const created = await firstValueFrom(this.toursService.apiToursPost({
      name: `Demo Tour ${this.tours.length + 1}`,
      description: 'Created from the Angular demo',
      from: plan?.from ?? this.routeFrom,
      to: plan?.to ?? this.routeTo,
      transportType: plan?.transportType ?? this.routeTransportType,
      distanceKm: plan?.distanceKm ?? 4.5,
      estimatedTimeMinutes: plan?.estimatedTimeMinutes ?? 60,
    } as TourRequest));

    this.actionMessage = `Created tour ${created.name ?? 'new tour'}`;
    await this.refreshTours();
    await this.refreshSearch();
    if (created.id == null) {
      throw new Error('Backend did not return a tour id.');
    }

    this.selectedTourId = created.id;
    await this.refreshLogs();
    await this.syncPlannerWithSelection();
  }

  async createLog(): Promise<void> {
    if (this.selectedTourId == null) {
      this.actionMessage = 'Select a tour first.';
      return;
    }

    const created = await firstValueFrom(this.tourLogsService.apiToursTourIdLogsPost(this.selectedTourId, {
      logDateTime: new Date().toISOString(),
      comment: 'Created from the Angular demo',
      difficulty: 'easy',
      totalDistanceKm: 4.5,
      totalTimeMinutes: 63,
      rating: 5,
    } as TourLogRequest));

    this.actionMessage = `Created log ${created.id ?? 'new log'}`;
    await this.refreshLogs();
    await this.refreshSearch();
  }

  selectTour(id?: number): void {
    if (id == null) {
      return;
    }

    this.selectedTourId = id;
    void this.refreshLogs();
    void this.syncPlannerWithSelection();
  }

  private async planRouteForCreation(): Promise<TourPlanResponse | null> {
    try {
      return await firstValueFrom(this.http.post<TourPlanResponse>(`${environment.apiRoot}/api/tours/plan`, {
        from: this.routeFrom,
        to: this.routeTo,
        transportType: this.routeTransportType,
      }));
    } catch {
      return null;
    }
  }

  private async syncPlannerWithSelection(): Promise<void> {
    const selected = this.getSelectedTour();
    if (!selected?.from || !selected?.to) {
      return;
    }

    this.routeFrom = selected.from;
    this.routeTo = selected.to;
    this.routeTransportType = selected.transportType || 'walking';
    await this.planRoute();
  }

  private getSelectedTour(): TourResponse | TourSearchResponse | null {
    return this.searchResults.find(x => x.id === this.selectedTourId)
      ?? this.tours.find(x => x.id === this.selectedTourId)
      ?? null;
  }

  private renderMap(): void {
    if (!this.mapHost) {
      return;
    }

    if (!this.map) {
      this.map = L.map(this.mapHost.nativeElement, { zoomControl: true }).setView([48.2, 16.37], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(this.map);
    }

    this.routeLayer?.remove();

    const geometry = this.plannedRoute?.geometry ?? [];
    if (geometry.length === 0) {
      return;
    }

    const latLngs = geometry.map(point => [point.latitude, point.longitude] as [number, number]);
    this.routeLayer = L.polyline(latLngs, { color: '#2563eb', weight: 5 }).addTo(this.map);
    this.map.fitBounds(this.routeLayer.getBounds(), { padding: [24, 24] });
  }

  private applySession(response: AuthResponse): void {
    if (!response.token) {
      throw new Error('Backend did not return a token.');
    }

    this.session.setToken(response.token);
  }
}
