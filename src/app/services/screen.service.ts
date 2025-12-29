import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScreenService {
  readonly isSmallScreen = signal(false);

  private readonly mediaQueryList = matchMedia('(width < 40rem)');
  private isListenerAttached = false;

  connect(): void {
    this.setSmallScreenValue();

    if (this.isListenerAttached) return;
    this.mediaQueryList.addEventListener('change', this.setSmallScreenValue);
    this.isListenerAttached = true;
  }

  private readonly setSmallScreenValue = () => {
    this.isSmallScreen.set(this.mediaQueryList.matches);
  };
}
