import { Injectable } from '@angular/core';
import { PendingRegistrationData } from '../types';

@Injectable({
  providedIn: 'root',
})
export class RegistrationStateService {
  private registrationData: PendingRegistrationData | null = null;

  setRegistrationData(data: PendingRegistrationData): void {
    this.registrationData = data;
  }

  getRegistrationData(): PendingRegistrationData | null {
    return this.registrationData;
  }

  clearRegistrationData(): void {
    this.registrationData = null;
  }
}
