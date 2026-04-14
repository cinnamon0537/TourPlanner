import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiSessionService } from '../../shared/api-session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(ApiSessionService);
  const router = inject(Router);

  return session.hasToken() || router.parseUrl('/');
};
