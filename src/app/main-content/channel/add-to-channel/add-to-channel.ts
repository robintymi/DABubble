import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OverlayService } from '../../../services/overlay.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { take } from 'rxjs';

type ChannelMember = {
  id: string;
  name: string;
};

type SuggestedMember = {
  id: string;
  name: string;
  avatar: string;
  subtitle?: string;
  status?: 'online' | 'offline';
};

@Component({
  selector: 'app-add-to-channel',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './add-to-channel.html',
  styleUrl: './add-to-channel.scss',
  animations: [
    trigger('fadeScale', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px) scale(0.96)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-4px) scale(0.96)' })),
      ]),
    ]),
  ],
})
export class AddToChannel implements OnInit {
  private readonly overlayService = inject(OverlayService);
  private readonly userService = inject(UserService);

  @Input() channelTitle = 'Entwicklerteam';
  @Input() members: ChannelMember[] = [];

  protected visible = true;
  protected searchTerm = '';
  protected showSuggestions = false;
  protected suggestedMembers: SuggestedMember[] = [];
  protected filteredMembers: SuggestedMember[] = [];

  ngOnInit(): void {
    this.userService
      .getAllUsers()
      .pipe(take(1))
      .subscribe((users) => {
        this.suggestedMembers = users
          .filter((user) => !this.members.some((member) => member.id === user.uid))
          .map((user) => ({
            id: user.uid,
            name: user.name,
            avatar: user.photoUrl || 'imgs/users/placeholder.svg',
            subtitle: user.email ?? undefined,
            status: user.onlineStatus ? 'online' : 'offline',
          }));

        this.filteredMembers = this.filterMembers(this.searchTerm);
      });
  }

  protected onSearchFocus(): void {
    this.showSuggestions = true;
    this.filteredMembers = this.filterMembers(this.searchTerm);
  }

  protected onSearch(term: string): void {
    this.searchTerm = term;
    this.filteredMembers = this.filterMembers(term);
  }

  protected filterMembers(term: string): SuggestedMember[] {
    const search = term.trim().toLowerCase();

    if (!search) {
      return [...this.suggestedMembers];
    }

    return this.suggestedMembers.filter((member) =>
      member.name.toLowerCase().includes(search)
    );
  }

  protected closeOverlay(): void {
    this.visible = false;
  }

  protected onAnimationDone(): void {
    if (!this.visible) {
      this.overlayService.closeLast();
    }
  }
}