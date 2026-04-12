import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, AuthService, LoginRequest, RegisterRequest, OkStatus, TourLogRequest, TourLogResponse, TourLogsService, TourRequest, TourResponse, ToursService, ValuesService } from '../../swagger';
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

@Component({
  selector: 'app-test-general',
  standalone: true,
  imports: [
    MatButtonModule,
  ],
  templateUrl: './test-general.html',
  styleUrl: './test-general.scss'
})
export class TestGeneral implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toursService = inject(ToursService);
  private tourLogsService = inject(TourLogsService);
  private valuesService = inject(ValuesService);
  private session = inject(ApiSessionService);
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
  actionMessage = '';
  searchTerm = '';
  versionString = `v${version} [${versionDateString}]`;

  async ngOnInit(): Promise<void> {
    await this.bootstrap();
  }

  async bootstrap(): Promise<void> {
    await this.ensureDemoSession();
    this.refreshStatus();
    await this.refreshTours();
    await this.refreshSearch();
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

  async createTour(): Promise<void> {
    const created = await firstValueFrom(this.toursService.apiToursPost({
      name: `Demo Tour ${this.tours.length + 1}`,
      description: 'Created from the Angular demo',
      from: 'Start',
      to: 'Finish',
      transportType: 'walking',
      distanceKm: 4.5,
      estimatedTimeMinutes: 60,
    } as TourRequest));

    this.actionMessage = `Created tour ${created.name ?? 'new tour'}`;
    await this.refreshTours();
    await this.refreshSearch();
    if (created.id == null) {
      throw new Error('Backend did not return a tour id.');
    }

    this.selectedTourId = created.id;
    await this.refreshLogs();
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
  }

  private applySession(response: AuthResponse): void {
    if (!response.token) {
      throw new Error('Backend did not return a token.');
    }

    this.session.setToken(response.token);
  }
}
