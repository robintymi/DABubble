import { inject } from '@angular/core';
import { CanMatchFn, Router, Route, UrlSegment } from '@angular/router';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthService } from '../services/auth';

export const onlyVerifiedGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return combineLatest([authService.isLoggedIn$, authService.isEmailVerified$]).pipe(
    map(([isLoggedIn, isEmailVerified]) => {
      if (!isLoggedIn) {
        return router.createUrlTree(['/login']);
      }

      if (!isEmailVerified) {
        return router.createUrlTree(['/verify-email']);
      }

      return true;
    })
  );
};
