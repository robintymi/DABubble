import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '@angular/fire/auth';

import { AuthService } from '../../services/auth.service';
import { NOTIFICATIONS } from '../../notifications';
import { AsideContentWrapperComponent } from '../../aside-content/aside-content-wrapper';
import { ToastService } from '../../toast/toast.service';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, AsideContentWrapperComponent],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  isChecking = false;
  isResending = false;

  statusMessage: string | null = null;
  infoMessage: string | null = null;
  errorMessage: string | null = null;

  get currentEmail(): string | null {
    return this.authService.auth.currentUser?.email ?? null;
  }

  get isBusy(): boolean {
    return this.isChecking || this.isResending;
  }

  private resetMessages(): void {
    this.statusMessage = null;
    this.infoMessage = null;
    this.errorMessage = null;
  }

  private getCurrentUserOrShowError(): User | null {
    const currentUser = this.authService.auth.currentUser;
    if (!currentUser) {
      this.toastService.error(NOTIFICATIONS.NO_USER_LOGGED_IN);
      return null;
    }
    return currentUser;
  }

  async onRefreshStatus(): Promise<void> {
    if (this.isBusy) {
      return;
    }

    this.isChecking = true;
    this.resetMessages();

    try {
      let currentUser = this.getCurrentUserOrShowError();
      if (!currentUser) {
        this.router.navigate(['/login']);
        return;
      }

      await currentUser.reload();
      currentUser = this.authService.auth.currentUser;
      if (currentUser?.emailVerified) {
        this.router.navigate(['/email-confirmed']);
      } else {
        this.statusMessage = NOTIFICATIONS.EMAIL_VERIFICATION_NOT_YET_CONFIRMED;
      }
    } catch (error: any) {
      const message = error?.message ?? NOTIFICATIONS.EMAIL_VERIFICATION_STATUS_REFRESH_ERROR;
      this.toastService.error(message);
    } finally {
      this.isChecking = false;
    }
  }

  async onResendVerificationEmail(): Promise<void> {
    if (this.isBusy) {
      return;
    }

    this.isResending = true;
    this.resetMessages();

    try {
      const currentUser = this.getCurrentUserOrShowError();
      if (!currentUser) {
        this.router.navigate(['/login']);
        return;
      }

      await this.authService.sendEmailVerificationLink(currentUser);

      this.toastService.info(NOTIFICATIONS.TOAST_EMAIL_RESENT, { icon: 'send' });
    } catch (error: any) {
      const message = error?.message ?? NOTIFICATIONS.GENERAL_ERROR;
      this.toastService.error(message);
    } finally {
      this.isResending = false;
    }
  }

  async onSignOut(): Promise<void> {
    if (this.isBusy) {
      return;
    }

    try {
      await this.authService.signOut();
      this.toastService.info(NOTIFICATIONS.TOAST_LOGOUT_SUCCESS);
    } catch (error: any) {
      const message = error?.message ?? NOTIFICATIONS.GENERAL_ERROR;
      this.toastService.error(message);
    }
  }
}
