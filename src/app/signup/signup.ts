import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthenticationResult } from '../services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private authenticationService = inject(AuthService);
  private router = inject(Router);

  name = '';
  emailAddress = '';
  password = '';
  acceptedPrivacy = false;

  isSubmitting = false;
  errorMessage: string | null = null;
  passwordValidationErrors: string[] = [];

  async onSubmit(form: NgForm): Promise<void> {
    if (this.isSubmitting || form.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.passwordValidationErrors = [];

    try {
      const passwordValidationResult = await this.authenticationService.validateUserPassword(
        this.password
      );

      if (!passwordValidationResult.isValid) {
        this.passwordValidationErrors =
          this.authenticationService.buildPasswordErrorMessages(passwordValidationResult);
        return;
      }

      const authenticationResult = await this.authenticationService.signUpWithEmailAndPassword(
        this.emailAddress,
        this.password
      );

      console.log(authenticationResult);

      await this.router.navigate(['/app']);
    } catch (error: any) {
      if (error && typeof error === 'object' && 'success' in error) {
        const authenticationResultError = error as AuthenticationResult<unknown>;
        this.errorMessage = authenticationResultError.errorMessage ?? 'Signup fehlgeschlagen.';
      } else {
        this.errorMessage = error?.message ?? 'Signup fehlgeschlagen.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
