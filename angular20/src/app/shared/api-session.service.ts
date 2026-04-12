import { Injectable } from '@angular/core';

const tokenKey = 'tourplanner.jwt';

@Injectable({ providedIn: 'root' })
export class ApiSessionService {
  getToken(): string | null {
    return localStorage.getItem(tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(tokenKey, token);
  }

  clear(): void {
    localStorage.removeItem(tokenKey);
  }
}
