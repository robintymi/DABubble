import { Component, signal, inject, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, filter, takeUntil } from 'rxjs';
import { BrandStateService } from './services/brand-state.service';
import { Startscreen } from './startscreen/startscreen';
import { ToastOutletComponent } from './toast/toast-outlet';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Startscreen, CommonModule, ToastOutletComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnDestroy {
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  constructor(public brandState: BrandStateService) {
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart && event.url === '/login'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.brandState.resetSplash();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected readonly title = signal('daBubble');
}
