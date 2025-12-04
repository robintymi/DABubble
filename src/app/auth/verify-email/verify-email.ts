import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '@angular/fire/auth';

import { AuthService } from '../../services/auth.service';
import { NOTIFICATIONS } from '../../notifications';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isChecking = false;
  isResending = false;

  statusMessage: string | null = null;
  infoMessage: string | null = null;
  errorMessage: string | null = null;

  get currentEmail(): string | null {
    return this.authService.auth.currentUser?.email ?? null;
  }

  private get isBusy(): boolean {
    return this.isChecking || this.isResending;
  }

  private resetMessages(): void {
    this.statusMessage = null;
    this.infoMessage = null;
    this.errorMessage = null;
  }

  private getCurrentUserOrSetError(): User | null {
    const currentUser = this.authService.auth.currentUser;
    if (!currentUser) {
      this.errorMessage = NOTIFICATIONS.NO_USER_LOGGED_IN;
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
      const currentUser = this.getCurrentUserOrSetError();
      if (!currentUser) {
        setTimeout(() => this.router.navigate(['/login']), 1500);
        return;
      }

      await currentUser.reload();
      if (currentUser.emailVerified) {
        this.router.navigate(['/email-confirmed']);
      } else {
        this.statusMessage = NOTIFICATIONS.EMAIL_VERIFICATION_NOT_YET_CONFIRMED;
      }
    } catch (error: any) {
      this.errorMessage = error?.message ?? NOTIFICATIONS.EMAIL_VERIFICATION_STATUS_REFRESH_ERROR;
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
      const currentUser = this.getCurrentUserOrSetError();
      if (!currentUser) {
        setTimeout(() => this.router.navigate(['/login']), 1500);
        this.router.navigate(['/login']);
        return;
      }

      await this.authService.sendEmailVerificationLink(currentUser);
      this.infoMessage = NOTIFICATIONS.EMAIL_VERIFICATION_RESENT_SUCCESS;
    } catch (error: any) {
      this.errorMessage = error?.message ?? NOTIFICATIONS.GENERAL_ERROR;
    } finally {
      this.isResending = false;
    }
  }
}
