import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NOTIFICATIONS } from '../../notifications';

@Component({
  selector: 'app-email-confirmed',
  imports: [CommonModule, RouterLink],
  templateUrl: './email-confirmed.html',
  styleUrl: './email-confirmed.scss',
})
export class EmailConfirmed implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly activatedRoute = inject(ActivatedRoute);

  isProcessingVerification = true;
  verificationErrorMessage: string | null = null;

  async ngOnInit(): Promise<void> {
    const queryParamMap = this.activatedRoute.snapshot.queryParamMap;
    const outOfBandCode = queryParamMap.get('oobCode');
    const mode = queryParamMap.get('mode');

    const currentUser = this.authService.auth.currentUser;

    if (currentUser?.emailVerified) {
      this.isProcessingVerification = false;
      this.verificationErrorMessage = null;
      return;
    }

    if (!outOfBandCode || mode !== 'verifyEmail') {
      this.isProcessingVerification = false;
      this.verificationErrorMessage = NOTIFICATIONS.FIREBASE_EXPIRED_OOB_CODE;
      return;
    }

    try {
      await this.authService.verifyEmail(outOfBandCode);
      this.verificationErrorMessage = null;
    } catch (error: any) {
      this.verificationErrorMessage = error?.message ?? NOTIFICATIONS.GENERAL_ERROR;
    } finally {
      this.isProcessingVerification = false;
    }
  }
}
