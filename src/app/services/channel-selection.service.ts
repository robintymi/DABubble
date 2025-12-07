import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChannelSelectionService {
  private readonly selectedChannelIdSubject = new BehaviorSubject<string | null>(null);
  readonly selectedChannelId$ = this.selectedChannelIdSubject.asObservable();

  selectChannel(channelId: string | null | undefined): void {
    if (!channelId) return;
    if (this.selectedChannelIdSubject.value === channelId) return;

    this.selectedChannelIdSubject.next(channelId);
  }
}