import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, AuthService, LoginRequest, RegisterRequest } from '../../swagger';
import { ApiSessionService } from '../../shared/api-session.service';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private authService = inject(AuthService);
  private session = inject(ApiSessionService);

  statusMessage = 'Browse as guest or sign in to manage tours.';

  isAuthenticated(): boolean {
    return this.session.hasToken();
  }

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const response = await firstValueFrom(this.authService.apiAuthLoginPost({ identifier, password } as LoginRequest));
    this.storeSession(response);
    this.statusMessage = `Signed in as ${response.userName ?? identifier}.`;
    return response;
  }

  async register(userName: string, email: string, password: string): Promise<AuthResponse> {
    const response = await firstValueFrom(this.authService.apiAuthRegisterPost({ userName, email, password } as RegisterRequest));
    this.storeSession(response);
    this.statusMessage = `Registered and signed in as ${response.userName ?? userName}.`;
    return response;
  }

  logout(): void {
    this.session.clear();
    this.statusMessage = 'You are signed out.';
  }

  private storeSession(response: AuthResponse): void {
    if (!response.token) {
      throw new Error('Backend did not return a token.');
    }

    this.session.setToken(response.token);
  }
}
