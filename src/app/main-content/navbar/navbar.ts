import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { OverlayService } from '../../services/overlay.service';
import { NavbarDialog } from './navbar-dialog/navbar-dialog';

@Component({
  selector: 'app-navbar',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private overlayService = inject(OverlayService);


  openUserMenu(event: Event) {
    const target = event.currentTarget as HTMLElement;

    this.overlayService.open(NavbarDialog, {
      target,
      offsetX: -200,
      offsetY: 10,
      data: { originTarget: target },
    });
  }
}
