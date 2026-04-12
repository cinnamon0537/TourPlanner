import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiSessionService } from './api-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(ApiSessionService).getToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
