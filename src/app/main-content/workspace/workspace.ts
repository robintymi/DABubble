import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, of, shareReplay, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { CreateChannel } from './create-channel/create-channel';
import { Channel, FirestoreService } from '../../services/firestore.service';
import { AppUser, UserService } from '../../services/user.service';

type DirectMessageUser = AppUser & { displayName: string; unreadCount: number };
type ChannelListItem = Channel & { unreadCount: number };

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, CreateChannel],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
})
export class Workspace {
  private readonly firestoreService = inject(FirestoreService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly currentUser$ = toObservable(this.userService.currentUser);

  private readonly activeChannelIdSubject = new BehaviorSubject<string | null>(null);
  private readonly activeDmIdSubject = new BehaviorSubject<string | null>(null);

  @Input() set activeChannelId(value: string | null | undefined) {
    this.activeChannelIdSubject.next(value ?? null);
  }

  @Input() set activeDmId(value: string | null | undefined) {
    this.activeDmIdSubject.next(value ?? null);
  }

  @Output() channelSelected = new EventEmitter<void>();

  protected readonly activeChannelId$ = this.activeChannelIdSubject.asObservable();
  protected readonly activeDmId$ = this.activeDmIdSubject.asObservable();

  protected readonly channelsWithUnread$: Observable<ChannelListItem[]> = combineLatest([
    this.firestoreService.getChannels(),
    this.currentUser$,
  ]).pipe(
    switchMap(([channels, currentUser]) => {
      if (!currentUser) return of([]);

      const channelObservables = channels.map((channel) => {
        const channelId = channel.id;
        if (!channelId) return of({ ...channel, unreadCount: 0 });

        return this.firestoreService.getChannelMessages(channelId).pipe(
          map((messages) => {
            const lastRead = this.getChannelLastRead(currentUser.uid, channelId);
            const unreadCount = messages.filter((message) => {
              const createdAtMs = message.createdAt?.toMillis?.() ?? 0;
              return message.authorId !== currentUser.uid && createdAtMs > lastRead;
            }).length;

            return { ...channel, unreadCount };
          })
        );
      });

      return channelObservables.length ? combineLatest(channelObservables) : of([]);
    })
  );

  protected readonly directMessageUsers$: Observable<DirectMessageUser[]> = combineLatest([
    this.userService.getAllUsers(),
    this.currentUser$,
  ]).pipe(
    switchMap(([users, currentUser]) => {
      if (!currentUser) {
        return of([]);
      }

      const directMessageUsers$ = users.map((user) => this.buildDirectMessageUser(user, currentUser));

      if (!directMessageUsers$.length) {
        return of([]);
      }

      return combineLatest(directMessageUsers$).pipe(
        map((directMessageUsers) =>
          [...directMessageUsers].sort((a, b) => {
            if (a.unreadCount !== b.unreadCount) {
              return b.unreadCount - a.unreadCount;
            }

            if (a.uid === currentUser.uid) return -1;
            if (b.uid === currentUser.uid) return 1;

            return a.name.localeCompare(b.name);
          })
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  protected readonly directMessageUnreadTotal$ = this.directMessageUsers$.pipe(
    map((users) => users.reduce((total, user) => total + (user.unreadCount ?? 0), 0))
  );

  protected areChannelsCollapsed = false;
  protected areDirectMessagesCollapsed = false;
  protected isCreateChannelOpen = false;
  protected isAddChannelHovered = false;
  protected isChannelsHeaderHovered = false;
  protected isDirectMessagesHeaderHovered = false;

  protected startNewMessage(): void {
    void this.router.navigate(['/main/new-message']);
  }

  protected openCreateChannel(): void {
    this.isCreateChannelOpen = true;
  }

  protected closeCreateChannel(): void {
    this.isCreateChannelOpen = false;
  }

  protected toggleChannels(): void {
    this.areChannelsCollapsed = !this.areChannelsCollapsed;
  }

  protected selectChannel(channelId?: string | null): void {
    if (!channelId) return;
    void this.router.navigate(['/main/channels', channelId]);
    this.channelSelected.emit();

    const currentUser = this.userService.currentUser();
    if (currentUser?.uid && channelId) {
      this.setChannelLastRead(currentUser.uid, channelId);
    }
  }

  protected toggleDirectMessages(): void {
    this.areDirectMessagesCollapsed = !this.areDirectMessagesCollapsed;
  }

  protected openDirectMessage(user: AppUser): void {
    if (!user?.uid) return;
    void this.router.navigate(['/main/dms', user.uid]);
  }

  private buildDirectMessageUser(user: AppUser, currentUser: AppUser): Observable<DirectMessageUser> {
    const displayName = user.uid === currentUser.uid ? `${user.name} (Du)` : user.name;

    if (user.uid === currentUser.uid) {
      return of({ ...user, displayName, unreadCount: 0 });
    }

    return combineLatest([
      this.firestoreService.getDirectConversationMessages(currentUser.uid, user.uid),
      this.firestoreService.getDirectMessageReadStatus(currentUser.uid, user.uid),
      this.activeDmId$,
    ]).pipe(
      map(([messages, lastReadAt, activeDmId]) => {
        const lastReadMs = lastReadAt?.toMillis() ?? 0;
        const isActive = activeDmId === user.uid;
        const unreadCount = messages.filter((message) => {
          const createdAtMs = message.createdAt?.toMillis() ?? 0;
          return message.authorId !== currentUser.uid && createdAtMs > lastReadMs;
        }).length;

        return { ...user, displayName, unreadCount: isActive ? 0 : unreadCount };
      })
    );
  }

  private getChannelLastRead(userId: string, channelId: string): number {
    if (typeof localStorage === 'undefined') return 0;
    const key = this.getChannelLastReadKey(userId, channelId);
    const value = localStorage.getItem(key);
    return value ? Number(value) : 0;
  }

  private setChannelLastRead(userId: string, channelId: string): void {
    if (typeof localStorage === 'undefined') return;
    const key = this.getChannelLastReadKey(userId, channelId);
    localStorage.setItem(key, Date.now().toString());
  }

  private getChannelLastReadKey(userId: string, channelId: string): string {
    return `channelLastRead:${userId}:${channelId}`;
  }

  protected trackChannel(index: number, channel: ChannelListItem): string {
    return channel.id ?? `${index}`;
  }

  protected trackDirectUser(index: number, user: DirectMessageUser): string {
    return user.uid ?? `${index}`;
  }
}
