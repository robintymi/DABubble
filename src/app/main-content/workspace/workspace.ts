import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CreateChannel } from './create-channel/create-channel';
import { OverlayService } from '../../services/overlay.service';

import {
  Channel,
  DirectMessage,
  FirestoreService,
} from '../../services/firestore.service'; import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';
import { ChannelSelectionService } from '../../services/channel-selection.service';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
})
export class Workspace {
  private readonly firestoreService = inject(FirestoreService);
  private readonly authService = inject(AuthService);
  private readonly channelSelectionService = inject(ChannelSelectionService);
  private readonly overlayService = inject(OverlayService);
  @Output() readonly newMessage = new EventEmitter<void>();
  protected readonly channels$: Observable<Channel[]> =
    this.firestoreService.getChannels();
  protected readonly directMessages$: Observable<DirectMessage[]> =
    this.firestoreService.getDirectMessages();
  protected readonly currentUser$: Observable<User | null> = this.authService.user$;
  protected readonly selectedChannelId$ =
    this.channelSelectionService.selectedChannelId$;
  protected areChannelsCollapsed = false;
  protected areDirectMessagesCollapsed = false;
  protected startNewMessage(): void {
    this.newMessage.emit();
  }
  protected openCreateChannel(): void {
    this.overlayService.open(CreateChannel);
  }
  protected toggleChannels(): void {
    this.areChannelsCollapsed = !this.areChannelsCollapsed;
  }

  protected selectChannel(channelId?: string | null): void {
    this.channelSelectionService.selectChannel(channelId);
  }

  protected toggleDirectMessages(): void {
    this.areDirectMessagesCollapsed = !this.areDirectMessagesCollapsed;
  }

}

