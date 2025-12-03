import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { OverlayService } from '../../../services/overlay.service';

@Component({
  selector: 'app-profile-menu-edit',
  imports: [MatIcon],
  templateUrl: './profile-menu-edit.html',
  styleUrl: './profile-menu-edit.scss',
})
export class ProfileMenuEdit {
    private overlayService = inject(OverlayService);
  closeOverlay() {
    this.overlayService.closeLast();
  }

  updateName() {
    console.log('Name updated');
  }
}
