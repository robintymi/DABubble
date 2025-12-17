import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface MemberDialogData {
  user: {
    name: string;
    photoUrl?: string;
    email?: string;
    onlineStatus?: string;
  };
}

@Component({
  selector: 'app-member-dialog',
  imports: [MatIcon, CommonModule],
  templateUrl: './member-dialog.html',
  styleUrl: './member-dialog.scss',
})
export class MemberDialog {
  constructor(
    public dialogRef: MatDialogRef<MemberDialog>,
    @Inject(MAT_DIALOG_DATA) public data: MemberDialogData
  ) {}

  close() {
    this.dialogRef.close();
  }

  openDirectMessage() {
    console.log('Nachricht an', this.data.user.name);
    this.dialogRef.close();
  }
}
