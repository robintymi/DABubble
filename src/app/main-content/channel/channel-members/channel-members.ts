import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OverlayService } from '../../../services/overlay.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { AddToChannel } from '../add-to-channel/add-to-channel';

type ChannelMember = {
  id: string;            // <-- hinzugefügt
  name: string;
  avatar: string;
  subtitle?: string;
  isCurrentUser?: boolean;
};

@Component({
  selector: 'app-channel-members',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './channel-members.html',
  styleUrls: ['./channel-members.scss'], // <-- plural
  animations: [
    trigger('fadeScale', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px) scale(0.96)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-4px) scale(0.96)' }))
      ]),
    ]),
  ],
})
export class ChannelMembers {
  private readonly overlayService = inject(OverlayService);

  @Input() members: ChannelMember[] = [];
  @Input() title = 'Mitglieder';

  protected visible = true;

  protected closeOverlay(): void {
    this.visible = false;
  }

  protected onAnimationDone(): void {
    if (!this.visible) {
      this.overlayService.closeLast();
    }
  }

  protected openAddToChannel(event: Event): void {
    const target = event.currentTarget as HTMLElement | null;

    this.overlayService.open(AddToChannel, {
      target: target ?? undefined,
      offsetY: 8,
      data: { channelTitle: this.title, members: this.members },
    });
  }
}