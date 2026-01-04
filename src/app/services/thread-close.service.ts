import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThreadCloseService {
  private readonly closeRequests = new Subject<void>();
  readonly closeRequests$ = this.closeRequests.asObservable();

  requestClose(): void {
    this.closeRequests.next();
  }
}
