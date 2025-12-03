import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  UserCredential,
  authState,
  user,
  createUserWithEmailAndPassword,
  idToken,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  AuthErrorCodes,
  validatePassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { PasswordValidationResult } from '../types';
import { NOTIFICATIONS } from '../notifications';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly auth: Auth = inject(Auth);

  constructor() {
    this.auth.useDeviceLanguage();
  }

  readonly user$: Observable<User | null> = user(this.auth);
  readonly authState$: Observable<User | null> = authState(this.auth);
  readonly idToken$: Observable<string | null> = idToken(this.auth);

  readonly isLoggedIn$: Observable<boolean> = this.authState$.pipe(
    map((currentUser) => currentUser != null),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly isEmailVerified$: Observable<boolean> = this.user$.pipe(
    map((currentUser) => Boolean(currentUser?.emailVerified || currentUser?.isAnonymous)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private throwMappedError(error: any): never {
    const mappedMessage = this.mapFirebaseError(error);
    if (mappedMessage) {
      throw new Error(mappedMessage);
    }
    throw error;
  }

  async signUpWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      this.throwMappedError(error);
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
      return await firebaseSignInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      this.throwMappedError(error);
    }
  }

  async signInWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      this.throwMappedError(error);
    }
  }

  async signInAsGuest(): Promise<UserCredential> {
    try {
      return await signInAnonymously(this.auth);
    } catch (error: any) {
      this.throwMappedError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error: any) {
      this.throwMappedError(error);
    }
  }

  async updateUserProfile(displayName?: string | null, photoURL?: string | null): Promise<User> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error(NOTIFICATIONS.NO_USER_LOGGED_IN);
    }

    try {
      await updateProfile(currentUser, {
        displayName: displayName ?? currentUser.displayName ?? undefined,
        photoURL: photoURL ?? currentUser.photoURL ?? undefined,
      });

      return currentUser;
    } catch (error: any) {
      this.throwMappedError(error);
    }
  }

  async sendEmailVerificationLink(user: User | null): Promise<void> {
    if (!user) {
      throw new Error(NOTIFICATIONS.NO_USER_LOGGED_IN);
    }

    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/email-confirmed`,
        handleCodeInApp: false,
      });
    } catch (error: any) {
      this.throwMappedError(error);
    }
  }

  private mapFirebaseError(error: any): string | undefined {
    const code = error?.code;
    switch (code) {
      case AuthErrorCodes.INVALID_EMAIL:
        return 'Die E-Mail-Adresse ist ungültig.';
      case AuthErrorCodes.USER_DISABLED:
        return 'Dieser Benutzer wurde deaktiviert.';
      case AuthErrorCodes.USER_DELETED:
        return 'Es existiert kein Benutzer mit diesen Daten.';
      case AuthErrorCodes.INVALID_PASSWORD:
        return 'Das Passwort ist falsch.';
      case AuthErrorCodes.EMAIL_EXISTS:
        return 'Diese E-Mail-Adresse wird bereits verwendet.';
      case AuthErrorCodes.WEAK_PASSWORD:
        return 'Das Passwort ist zu schwach.';
      case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
        return 'Ungültige Anmeldedaten.';
      default:
        return undefined;
    }
  }

  async validateUserPassword(password: string): Promise<PasswordValidationResult> {
    const status = await validatePassword(this.auth, password);
    const unmetCriteria: PasswordValidationResult['unmetCriteria'] = {};
    const isValid = status.isValid;

    if (!isValid) {
      if (status.containsLowercaseLetter === false) {
        unmetCriteria.missingLowercase = 'Mindestens ein Kleinbuchstabe wird benötigt.';
      }
      if (status.containsUppercaseLetter === false) {
        unmetCriteria.missingUppercase = 'Mindestens ein Großbuchstabe wird benötigt.';
      }
      if (status.containsNumericCharacter === false) {
        unmetCriteria.missingNumber = 'Mindestens eine Zahl wird benötigt.';
      }
      if (status.containsNonAlphanumericCharacter === false) {
        unmetCriteria.missingSpecialChar = 'Mindestens ein Sonderzeichen wird benötigt.';
      }
      if (status.meetsMinPasswordLength === false) {
        unmetCriteria.tooShort = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
      }
      if (status.meetsMaxPasswordLength === false) {
        unmetCriteria.tooLong = 'Das Passwort darf höchstens 50 Zeichen lang sein.';
      }
    }

    return { isValid, unmetCriteria };
  }

  buildPasswordErrorMessages(passwordValidationResult: PasswordValidationResult): string[] {
    return Object.values(passwordValidationResult.unmetCriteria).filter(
      (criteriaMessage) => typeof criteriaMessage === 'string'
    );
  }
}
