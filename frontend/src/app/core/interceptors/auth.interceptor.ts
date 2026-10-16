import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.token();
  const currentUser = authService.currentUser();

  let modifiedReq = req;

  const headers: { [key: string]: string } = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (currentUser?.businessId) {
    headers['X-Business-Id'] = currentUser.businessId;
  }

  if (Object.keys(headers).length > 0) {
    modifiedReq = req.clone({
      setHeaders: headers
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
        authService.logout();
        router.navigate(['/auth/login']);
      } else if (error.status === 403 && !req.url.includes('/auth/login')) {
        const msg = (error.error?.message || '').toLowerCase();
        if (msg.includes('suspended')) {
          authService.logout();
          router.navigate(['/auth/login'], { queryParams: { reason: 'suspended' } });
        }
      }
      return throwError(() => error);
    })
  );
};
