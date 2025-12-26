import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { ThreadContext, ThreadService } from '../../services/thread.service';
import { UserService } from '../../services/user.service';
import { OverlayService } from '../../services/overlay.service';
import { MessageEditor } from '../shared/message-editor/message-editor';


@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './thread.html',
  styleUrl: './thread.scss',
})
export class Thread {
  private readonly threadService = inject(ThreadService);
  private readonly userService = inject(UserService);
  private readonly overlayService = inject(OverlayService);
  protected readonly thread$: Observable<ThreadContext | null> =
    this.threadService.thread$;
  @ViewChild('replyTextarea') replyTextarea?: ElementRef<HTMLTextAreaElement>;
  protected messageReactions: Record<string, string> = {};
  protected openEmojiPickerFor: string | null = null;
  protected readonly emojiChoices = ['😀', '😄', '😍', '🎉', '🤔', '👏'];


  protected get currentUser() {
    const user = this.userService.currentUser();

    return {
      name: user?.name ?? 'Gast',
      avatar: user?.photoUrl ?? 'imgs/default-profile-picture.png',
    };
  }
  protected draftReply = '';

  protected closeThread(): void {
    this.threadService.reset();
  }

  protected async sendReply(): Promise<void> {
    const trimmed = this.draftReply.trim();
    if (!trimmed) return;

    try {
      await this.threadService.addReply({
        author: this.currentUser.name,
        avatar: this.currentUser.avatar,
        text: trimmed,
        isOwn: true,
      });

      this.draftReply = '';
    } catch (error) {
      console.error('Reply konnte nicht gespeichert werden', error);
    }

  }
  react(messageId: string | undefined, reaction: string): void {
    if (!messageId) return;
    if (this.messageReactions[messageId] === reaction) {
      const { [messageId]: _removed, ...rest } = this.messageReactions;
      this.messageReactions = rest;
    } else {
      this.messageReactions = {
        ...this.messageReactions,
        [messageId]: reaction,
      };
    }
    this.openEmojiPickerFor = null;
  }

  toggleEmojiPicker(messageId: string | undefined): void {
    if (!messageId) return;

    this.openEmojiPickerFor =
      this.openEmojiPickerFor === messageId ? null : messageId;
  }

  protected focusComposer(): void {
    this.replyTextarea?.nativeElement.focus();
  }

  protected openEditOverlay(
    event: Event,
    message: { id?: string; text: string },
    isRoot = false
  ): void {
    const trigger = event.currentTarget as HTMLElement | null;

    this.overlayService.open(MessageEditor, {
      target: trigger ?? undefined,
      offsetY: 8,
      data: {
        title: 'Nachricht bearbeiten',
        initialText: message.text,
        onSave: async (newText: string) => {
          if (isRoot) {
            await this.threadService.updateRootMessage(newText);
            return;
          }

          if (message.id) {
            await this.threadService.updateReply(message.id, newText);
          }
        },
      },
    });
  }
}