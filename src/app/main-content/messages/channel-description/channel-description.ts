import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../../services/overlay.service';

@Component({
  selector: 'app-channel-description',
  imports: [CommonModule],
  templateUrl: './channel-description.html',
  styleUrl: './channel-description.scss',
})
export class ChannelDescription {
  private readonly overlayService = inject(OverlayService);

  @Input() title = '';
  @Input() description = '';
  @Input() createdBy = 'Team-Admins';
  @Input() createdAt = 'Gerade eben';

  protected closeOverlay(): void {
    this.overlayService.closeLast();
  }
}
