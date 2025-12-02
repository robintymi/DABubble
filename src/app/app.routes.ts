import { Routes } from '@angular/router';
import { Signup } from './signup/signup';
import { MainContent } from './main-content/main-content';
import { SetProfilePicture } from './set-profile-picture/set-profile-picture';
import { Login } from './login/login';
import { VerifyEmail } from './verify-email/verify-email';
import { EmailConfirmed } from './email-confirmed/email-confirmed';
import { publicOrRedirectGuard } from './guards/public-or-redirect.guard';
import { onlyUnverifiedGuard } from './guards/only-unverified.guard';
import { onlyVerifiedGuard } from './guards/only-verified.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    component: Login,
    canMatch: [publicOrRedirectGuard],
  },
  {
    path: 'signup',
    component: Signup,
    canMatch: [publicOrRedirectGuard],
  },
  {
    path: 'set-profile-picture',
    component: SetProfilePicture,
    canMatch: [publicOrRedirectGuard],
  },

  {
    path: 'verify-email',
    component: VerifyEmail,
    canMatch: [onlyUnverifiedGuard],
  },

  {
    path: 'email-confirmed',
    component: EmailConfirmed,
    canMatch: [publicOrRedirectGuard],
  },

  {
    path: 'main',
    component: MainContent,
    canMatch: [onlyVerifiedGuard],
  },
];
