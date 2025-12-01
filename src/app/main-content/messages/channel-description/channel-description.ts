import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channel-description',
  imports: [CommonModule],
  templateUrl: './channel-description.html',
  styleUrl: './channel-description.scss',
})
export class ChannelDescription {
  @Output() readonly close = new EventEmitter<void>();

  protected closeOverlay(): void {
    this.close.emit();
  }
}
