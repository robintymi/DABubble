import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { OverlayService } from '../../../services/overlay.service';
import { ProfileMenuEdit } from '../profile-menu-edit/profile-menu-edit';

@Component({
  selector: 'app-profile-menu',
  imports: [MatIcon],
  templateUrl: './profile-menu.html',
  styleUrl: './profile-menu.scss',
})
export class ProfileMenu {
  private overlayService = inject(OverlayService);
  originTarget!: HTMLElement;

  editProfile() {
    this.overlayService.closeLast();
    this.overlayService.open(ProfileMenuEdit, {
      target: this.originTarget,
      offsetX: -400,
      offsetY: 10,
    });

    console.log('Edit Profile clicked');
  }

  closeOverlay() {
    this.overlayService.closeLast();
  }
}
