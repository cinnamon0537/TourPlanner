import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { version, versionDateString } from './shared/version';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { BASE_PATH } from './swagger';
import { environment } from '../environments/environment';
import { authInterceptor } from './shared/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    { provide: BASE_PATH, useValue: environment.apiRoot },
  ]
};

console.log(`Based on Angular20 Template v${version} [${versionDateString}]`);
