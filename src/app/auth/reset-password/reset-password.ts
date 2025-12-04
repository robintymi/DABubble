import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NOTIFICATIONS } from '../../notifications';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  newPassword = '';
  confirmPassword = '';

  isLoading = true;
  isSubmitting = false;

  errorMessage: string | null = null;
  formErrorMessage: string | null = null;
  infoMessage: string | null = null;
  passwordValidationErrors: string[] = [];

  private outOfBandCode: string | null = null;
  private emailFromResetCode: string | null = null;

  async ngOnInit(): Promise<void> {
    const queryParamMap = this.activatedRoute.snapshot.queryParamMap;
    const outOfBandCode = queryParamMap.get('oobCode');
    const mode = queryParamMap.get('mode');

    if (!outOfBandCode || mode !== 'resetPassword') {
      this.errorMessage = NOTIFICATIONS.FIREBASE_INVALID_OOB_CODE;
      this.isLoading = false;
      return;
    }

    this.outOfBandCode = outOfBandCode;

    try {
      const email = await this.authService.verifyPasswordResetCode(outOfBandCode);
      this.emailFromResetCode = email;
    } catch (error: any) {
      this.errorMessage = error?.message ?? NOTIFICATIONS.GENERAL_ERROR;
    } finally {
      this.isLoading = false;
    }
  }

  onBackToLogin(): void {
    if (this.isSubmitting) {
      return;
    }
    this.router.navigate(['/login']);
  }

  async onSubmit(form: NgForm): Promise<void> {
    if (this.isSubmitting || form.invalid || !this.outOfBandCode || !this.emailFromResetCode) {
      return;
    }

    this.formErrorMessage = null;
    this.infoMessage = null;
    this.passwordValidationErrors = [];

    if (this.newPassword !== this.confirmPassword) {
      this.formErrorMessage = NOTIFICATIONS.PASSWORD_RESET_PASSWORD_MISMATCH;
      return;
    }

    const passwordValidationResult = await this.authService.validateUserPassword(this.newPassword);
    if (!passwordValidationResult.isValid) {
      this.passwordValidationErrors =
        this.authService.buildPasswordErrorMessages(passwordValidationResult);
      return;
    }

    this.isSubmitting = true;

    try {
      await this.authService.confirmPasswordReset(this.outOfBandCode, this.newPassword);

      await this.authService.signInWithEmailAndPassword(this.emailFromResetCode, this.newPassword);

      await this.router.navigate(['/main']);
    } catch (error: any) {
      this.formErrorMessage = error?.message ?? NOTIFICATIONS.GENERAL_ERROR;
    } finally {
      this.isSubmitting = false;
    }
  }
}
