import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OkStatus, TourLogRequest, TourLogResponse, TourLogsService, TourRequest, TourResponse, ToursService, ValuesService } from '../../swagger';
import { environment } from '../../../environments/environment';
import { TourExportDto, TourPlanDto, TourSearchItemDto } from '../models/dashboard.types';

export interface TourDraft extends TourRequest {
  id?: number;
}

export interface LogDraft extends TourLogRequest {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardFacadeService {
  private http = inject(HttpClient);
  private toursService = inject(ToursService);
  private tourLogsService = inject(TourLogsService);
  private valuesService = inject(ValuesService);

  okStatus: OkStatus | null = null;
  tours: TourResponse[] = [];
  searchResults: TourSearchItemDto[] = [];
  logs: TourLogResponse[] = [];
  selectedTourId: number | null = null;
  selectedLogId: number | null = null;
  tourDraft: TourDraft = this.createBlankTourDraft();
  logDraft: LogDraft = this.createBlankLogDraft();
  loading = false;
  loadingTours = false;
  loadingLogs = false;
  loadingSearch = false;
  routeLoading = false;
  actionMessage = '';
  logMessage = '';
  searchTerm = '';
  routeFrom = 'Vienna';
  routeTo = 'Graz';
  routeTransportType = 'walking';
  routeMessage = 'Plan a route to preview it on the map.';
  plannedRoute: TourPlanDto | null = null;
  exportMessage = '';
  exportJson = '';
  importJson = '';
  importMessage = '';
  bootstrapped = false;

  async bootstrap(): Promise<void> {
    if (this.bootstrapped) {
      return;
    }

    this.refreshStatus();
    await this.refreshTours();
    await this.refreshSearch();
    this.bootstrapped = true;
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

  async refreshTours(): Promise<void> {
    this.loadingTours = true;
    try {
      this.tours = await firstValueFrom(this.toursService.apiToursGet());
      this.selectedTourId ??= this.tours[0]?.id ?? null;
      this.loadTourDraftFromSelection();
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
      this.searchResults = await firstValueFrom(this.http.get<TourSearchItemDto[]>(`${environment.apiRoot}/api/tours/search`, { params }));

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

  async uploadTourImage(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await firstValueFrom(this.http.post<{ image: string }>(`${environment.apiRoot}/api/tours/image`, formData));
    this.tourDraft.image = response.image;
    this.actionMessage = 'Uploaded tour image.';
  }

  async refreshLogs(): Promise<void> {
    if (this.selectedTourId == null) {
      this.logs = [];
      this.selectedLogId = null;
      this.logDraft = this.createBlankLogDraft();
      return;
    }

    this.loadingLogs = true;
    try {
      this.logs = await firstValueFrom(this.tourLogsService.apiToursTourIdLogsGet(this.selectedTourId));
      this.selectedLogId ??= this.logs[0]?.id ?? null;
      this.loadLogDraftFromSelection();
    } finally {
      this.loadingLogs = false;
    }
  }

  selectTour(id?: number): void {
    if (id == null) {
      return;
    }

    this.selectedTourId = id;
    this.selectedLogId = null;
    this.loadTourDraftFromSelection();
    this.logMessage = '';
    void this.refreshLogs();
    void this.syncPlannerWithSelection();
  }

  newTour(): void {
    this.selectedTourId = null;
    this.tourDraft = this.createBlankTourDraft();
    this.logs = [];
    this.selectedLogId = null;
    this.logDraft = this.createBlankLogDraft();
    this.logMessage = '';
  }

  async saveTour(): Promise<void> {
    const payload: TourRequest = {
      name: this.tourDraft.name,
      description: this.tourDraft.description ?? null,
      image: this.tourDraft.image ?? null,
      from: this.tourDraft.from ?? null,
      to: this.tourDraft.to ?? null,
      transportType: this.tourDraft.transportType ?? null,
      distanceKm: this.tourDraft.distanceKm ?? 0,
      estimatedTimeMinutes: this.tourDraft.estimatedTimeMinutes ?? 0,
    };

    if (this.tourDraft.id == null) {
      const created = await firstValueFrom(this.toursService.apiToursPost(payload));
      this.selectedTourId = created.id ?? null;
      this.actionMessage = `Created tour ${created.name ?? 'new tour'}`;
    } else {
      await firstValueFrom(this.toursService.apiToursIdPut(this.tourDraft.id, payload));
      this.actionMessage = `Updated tour ${this.tourDraft.name}`;
    }

    await this.refreshTours();
  }

  async deleteTour(): Promise<void> {
    if (this.tourDraft.id == null) {
      return;
    }

    await firstValueFrom(this.toursService.apiToursIdDelete(this.tourDraft.id));
    this.actionMessage = `Deleted tour ${this.tourDraft.name}`;
    this.newTour();
    await this.refreshTours();
  }

  selectLog(id?: number): void {
    if (id == null) {
      return;
    }

    this.selectedLogId = id;
    this.loadLogDraftFromSelection();
  }

  newLog(): void {
    if (!this.hasSelectedTour) {
      this.logMessage = 'Select a tour first to create a log.';
      return;
    }

    this.selectedLogId = null;
    this.logDraft = this.createBlankLogDraft();
    this.logMessage = 'Create a new log for the selected tour.';
  }

  async saveLog(): Promise<void> {
    if (this.selectedTourId == null) {
      this.logMessage = 'Select a tour first to add or edit a log.';
      return;
    }

    const payload: TourLogRequest = {
      logDateTime: this.logDraft.logDateTime ?? new Date().toISOString(),
      comment: this.logDraft.comment ?? null,
      difficulty: this.logDraft.difficulty,
      totalDistanceKm: this.logDraft.totalDistanceKm ?? 0,
      totalTimeMinutes: this.logDraft.totalTimeMinutes ?? 0,
      rating: this.logDraft.rating ?? null,
    };

    try {
      if (this.logDraft.id == null) {
        const created = await firstValueFrom(this.tourLogsService.apiToursTourIdLogsPost(this.selectedTourId, payload));
        this.selectedLogId = created.id ?? null;
        this.logMessage = `Created log ${created.id ?? 'new log'} for the selected tour.`;
      } else {
        await firstValueFrom(this.tourLogsService.apiToursTourIdLogsIdPut(this.selectedTourId, this.logDraft.id, payload));
        this.logMessage = `Updated log ${this.logDraft.id}.`;
      }

      await this.refreshLogs();
    } catch (err) {
      this.logMessage = this.friendlyLogError(err);
    }
  }

  async deleteLog(): Promise<void> {
    if (this.selectedTourId == null || this.logDraft.id == null) {
      return;
    }

    await firstValueFrom(this.tourLogsService.apiToursTourIdLogsIdDelete(this.selectedTourId, this.logDraft.id));
    this.logMessage = `Deleted log ${this.logDraft.id}.`;
    this.newLog();
    await this.refreshLogs();
  }

  async planRoute(): Promise<void> {
    this.routeLoading = true;
    try {
      this.plannedRoute = await firstValueFrom(this.http.post<TourPlanDto>(`${environment.apiRoot}/api/tours/plan`, {
        from: this.routeFrom,
        to: this.routeTo,
        transportType: this.routeTransportType,
      }));
      this.routeMessage = `Planned via ${this.plannedRoute.source} with ${this.plannedRoute.distanceKm} km and ${this.plannedRoute.estimatedTimeMinutes} min.`;
      this.routeFrom = this.plannedRoute.from;
      this.routeTo = this.plannedRoute.to;
      this.routeTransportType = this.plannedRoute.transportType;
    } catch (err) {
      this.routeMessage = `Route planning failed: ${(err as Error).message}`;
      this.plannedRoute = null;
    } finally {
      this.routeLoading = false;
    }
  }

  async exportTours(): Promise<void> {
    const exportPayload = await firstValueFrom(this.http.get<TourExportDto>(`${environment.apiRoot}/api/tours/export`));
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
      description: 'Created from the Angular dashboard',
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
      comment: 'Created from the Angular dashboard',
      difficulty: 'easy',
      totalDistanceKm: 4.5,
      totalTimeMinutes: 63,
      rating: 5,
    } as TourLogRequest));

    this.actionMessage = `Created log ${created.id ?? 'new log'}`;
    await this.refreshLogs();
    await this.refreshSearch();
  }

  private async planRouteForCreation(): Promise<TourPlanDto | null> {
    try {
      return await firstValueFrom(this.http.post<TourPlanDto>(`${environment.apiRoot}/api/tours/plan`, {
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

  private getSelectedTour(): TourResponse | TourSearchItemDto | null {
    return this.searchResults.find(x => x.id === this.selectedTourId)
      ?? this.tours.find(x => x.id === this.selectedTourId)
      ?? null;
  }

  private createBlankTourDraft(): TourDraft {
    return {
      name: '',
      description: '',
      image: '',
      from: '',
      to: '',
      transportType: 'walking',
      distanceKm: 0,
      estimatedTimeMinutes: 0,
    };
  }

  private createBlankLogDraft(): LogDraft {
    return {
      logDateTime: new Date().toISOString(),
      comment: '',
      difficulty: 'easy',
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      rating: null,
    };
  }

  loadTourDraftFromSelection(): void {
    const selected = this.getSelectedTour();
    if (!selected) {
      this.tourDraft = this.createBlankTourDraft();
      return;
    }

    this.tourDraft = {
      id: selected.id,
      name: selected.name ?? '',
      description: selected.description ?? '',
      image: selected.image ?? '',
      from: selected.from ?? '',
      to: selected.to ?? '',
      transportType: selected.transportType ?? 'walking',
      distanceKm: selected.distanceKm ?? 0,
      estimatedTimeMinutes: selected.estimatedTimeMinutes ?? 0,
    };
  }

  private loadLogDraftFromSelection(): void {
    const selected = this.logs.find(log => log.id === this.selectedLogId);
    if (!selected) {
      this.logDraft = this.createBlankLogDraft();
      return;
    }

    this.logDraft = {
      id: selected.id,
      logDateTime: selected.logDateTime ?? new Date().toISOString(),
      comment: selected.comment ?? '',
      difficulty: selected.difficulty ?? 'easy',
      totalDistanceKm: selected.totalDistanceKm ?? 0,
      totalTimeMinutes: selected.totalTimeMinutes ?? 0,
      rating: selected.rating ?? null,
    };
  }

  get hasSelectedTour(): boolean {
    return this.selectedTourId != null;
  }

  private friendlyLogError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'Cannot reach the backend right now.';
      if (err.status === 400) return 'Please check the log fields. The date, difficulty, rating, and numbers must be valid.';
      if (err.status === 401) return 'Your session expired. Please log in again.';
      if (err.status === 404) return 'The selected tour or log was not found anymore.';
      if (err.status >= 500) return 'The server had a problem while saving the log.';
    }

    return 'Could not save the log. Please try again.';
  }
}
