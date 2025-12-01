import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Firestore, addDoc, collection, serverTimestamp } from '@angular/fire/firestore';
@Component({
  selector: 'app-create-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-channel.html',
  styleUrl: './create-channel.scss',
})
export class CreateChannel {

  // for sending modal to parent component
  @Output() readonly close = new EventEmitter<void>();

  private readonly firestore = inject(Firestore);
  protected title = '';
  protected description = '';
  protected isSubmitting = false;

  protected closeOverlay(): void {
    if (this.isSubmitting) {
      return;
    }
    this.close.emit();
  }

  protected async createChannel(form: NgForm): Promise<void> {
    if (this.isSubmitting || form.invalid) {
      return;
    }
    this.isSubmitting = true;

    try {
      const title = this.title.trim();
      const description = this.description.trim();

      let channelPayload: Record<string, unknown> = {
        title,
        createdAt: serverTimestamp(),
      };

      if (description) {
        channelPayload['description'] = description;
      }
      const channelsCollection = collection(this.firestore, 'channels');
      await addDoc(channelsCollection, channelPayload);

      form.resetForm();
      this.close.emit();
    }

    finally {
      this.isSubmitting = false;
    }
  }
}


