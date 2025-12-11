import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { ThreadContext, ThreadService } from '../../services/thread.service';
import { UserService } from '../../services/user.service';

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
  protected readonly thread$: Observable<ThreadContext | null> =
    this.threadService.thread$;

  protected get currentUser() {
    const user = this.userService.currentUser();

    return {
      name: user?.name ?? 'Gast',
      avatar: user?.photoUrl ?? 'imgs/default-profile-picture.png',
    };
  }
  protected draftReply = '';

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
}