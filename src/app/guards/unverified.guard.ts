import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { combineLatest } from 'rxjs';

export const unverifiedGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return combineLatest([authService.isEmailVerified$, authService.isLoggedIn$]).pipe(
    map(([isEmailVerified, isLoggedIn]) => {
      if (!isLoggedIn) {
        return router.createUrlTree(['/login']);
      }

      if (isEmailVerified) {
        return router.createUrlTree(['/email-confirmed']);
      }

      return true;
    })
  );
};
