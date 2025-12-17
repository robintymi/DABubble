import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-new-message-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new-massage-panel.html',
  styleUrl: './new-massage-panel.scss',
})
export class NewMessagePanel {
  @Output() readonly close = new EventEmitter<void>();
}