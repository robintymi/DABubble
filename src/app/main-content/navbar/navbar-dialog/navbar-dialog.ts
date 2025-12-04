import { Component, inject } from '@angular/core';
import { OverlayService } from '../../../services/overlay.service';
import { ProfileMenu } from '../profile-menu/profile-menu';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar-dialog',
  imports: [],
  templateUrl: './navbar-dialog.html',
  styleUrl: './navbar-dialog.scss',
})
export class NavbarDialog {
  private overlayService = inject(OverlayService);
  originTarget!: HTMLElement;

  constructor(private authService: AuthService) {}

  openProfileDialog(event: Event) {
    this.overlayService.open(ProfileMenu, {
      target: this.originTarget,
      offsetX: -400,
      offsetY: 10,
      data: { originTarget: this.originTarget },
    });
  }

  logOut() {
    this.authService.signOut();
    console.log('User logged out');
    this.overlayService.closeLast();
  }
}
