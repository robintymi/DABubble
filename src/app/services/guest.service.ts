import { Injectable, inject } from '@angular/core';
import {
  collection,
  collectionGroup,
  deleteDoc,
  deleteField,
  doc,
  DocumentReference,
  Firestore,
  runTransaction,
  getDocs,
  query,
  serverTimestamp,
  Transaction,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { NOTIFICATIONS } from '../notifications';
import { type AppUser } from './user.service';
import { PROFILE_PICTURE_URLS } from '../auth/set-profile-picture/set-profile-picture';
import { GuestRegistryData } from '../types';

const GUEST_FALLBACK_NUMBER = 999;

@Injectable({ providedIn: 'root' })
export class GuestService {
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  async buildGuestUserDocData() {
    const guestNumber = await this.getRandomGuestNumber();
    const name = `Gast ${guestNumber}`;

    return {
      name,
      photoUrl: PROFILE_PICTURE_URLS.default,
      isGuest: true,
    };
  }

  async signOutGuest(user: AppUser | null): Promise<void> {
    const firebaseUser = this.authService.auth.currentUser;

    if (!user || !firebaseUser) return;
    if (!user.isGuest || !firebaseUser.isAnonymous) return;

    const uid = user.uid;

    let deleted = false;
    try {
      await this.authService.deleteCurrentUser();
      deleted = true;
    } catch (error) {
      console.error(error);
      console.error(NOTIFICATIONS.ACCOUNT_DELETION_FAILURE);
    }

    if (!deleted) return;

    queueMicrotask(async () => {
      try {
        await this.deleteAllMessagesByAuthor(uid);
        await this.removeReactionsByUser(uid);
        await this.releaseGuestNumber(user.name);
        await deleteDoc(doc(this.firestore, `users/${uid}`));
      } catch (err) {
        console.error('Guest background cleanup failed', err);
      }
    });
  }

  private async deleteAllMessagesByAuthor(userId: string): Promise<void> {
    const db = this.firestore;

    try {
      const channelsSnap = await getDocs(collection(db, 'channels'));

      for (const channel of channelsSnap.docs) {
        const messagesSnap = await getDocs(
          query(collection(db, `channels/${channel.id}/messages`), where('authorId', '==', userId))
        );

        for (const message of messagesSnap.docs) {
          const threadsSnap = await getDocs(collection(message.ref, 'threads'));
          for (const reply of threadsSnap.docs) {
            await deleteDoc(reply.ref);
          }

          await deleteDoc(message.ref);
        }
      }

      const dmMessagesSnap = await getDocs(query(collectionGroup(db, 'messages'), where('authorId', '==', userId)));

      for (const dm of dmMessagesSnap.docs) {
        await deleteDoc(dm.ref);
      }
    } catch (error) {
      console.error('deleteAllMessagesByAuthor failed', error);
    }
  }

  private async removeReactionsByUser(userId: string): Promise<void> {
    const db = this.firestore;

    try {
      const channelsSnap = await getDocs(collection(db, 'channels'));

      for (const channel of channelsSnap.docs) {
        const messagesSnap = await getDocs(collection(db, `channels/${channel.id}/messages`));

        for (const message of messagesSnap.docs) {
          const data = message.data();
          const reactions = data['reactions'] as Record<string, string[]> | undefined;

          if (!reactions) continue;

          let changed = false;
          const updatedReactions: Record<string, string[]> = {};

          for (const [emoji, users] of Object.entries(reactions)) {
            const filtered = (users as string[]).filter((id) => id !== userId);

            if (filtered.length > 0) {
              updatedReactions[emoji] = filtered;
            }

            if (filtered.length !== users.length) {
              changed = true;
            }
          }

          if (changed) {
            await updateDoc(message.ref, {
              reactions: Object.keys(updatedReactions).length ? updatedReactions : deleteField(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
    } catch (err) {
      console.error('removeReactionsByUser failed', err);
    }
  }

  private async getRandomGuestNumber(): Promise<number> {
    const guestsDocRef = this.getGuestsDocRef();

    return runTransaction(this.firestore, async (transaction) => {
      const usedNumbers = await this.getUsedGuestNumbers(transaction, guestsDocRef);
      const availableNumbers = this.buildAvailableGuestNumbers(usedNumbers);

      if (!availableNumbers.length) {
        return GUEST_FALLBACK_NUMBER;
      }

      const selectedNumber = this.pickRandomNumber(availableNumbers);
      this.setUsedGuestNumbers(transaction, guestsDocRef, [...usedNumbers, selectedNumber]);
      return selectedNumber;
    });
  }

  private getGuestsDocRef(): DocumentReference<GuestRegistryData> {
    return doc(this.firestore, 'guests', 'registry');
  }

  private async getUsedGuestNumbers(
    transaction: Transaction,
    guestsDocRef: DocumentReference<GuestRegistryData>
  ): Promise<number[]> {
    const snap = await transaction.get(guestsDocRef);
    const data = snap.data();
    return data?.usedNumbers ?? [];
  }

  private buildAvailableGuestNumbers(usedNumbers: number[]): number[] {
    const usedSet = new Set<number>(usedNumbers);
    const availableNumbers: number[] = [];

    for (let number = 100; number <= 500; number += 1) {
      if (!usedSet.has(number)) {
        availableNumbers.push(number);
      }
    }

    return availableNumbers;
  }

  private pickRandomNumber(numbers: number[]): number {
    const randomIndex = Math.floor(Math.random() * numbers.length);
    return numbers[randomIndex];
  }

  private setUsedGuestNumbers(
    transaction: Transaction,
    guestsDocRef: DocumentReference<GuestRegistryData>,
    usedNumbers: number[]
  ): void {
    transaction.set(guestsDocRef, { usedNumbers }, { merge: true });
  }

  private async releaseGuestNumber(displayName: AppUser['name']): Promise<void> {
    const guestNumber = this.extractGuestNumber(displayName);
    if (guestNumber === null) return;

    const guestsDocRef = this.getGuestsDocRef();

    await runTransaction(this.firestore, async (transaction) => {
      const usedNumbers = await this.getUsedGuestNumbers(transaction, guestsDocRef);
      if (!usedNumbers.length) return;

      const nextNumbers = usedNumbers.filter((value) => value !== guestNumber);
      if (nextNumbers.length === usedNumbers.length) return;

      this.setUsedGuestNumbers(transaction, guestsDocRef, nextNumbers);
    });
  }

  private extractGuestNumber(displayName: string): number | null {
    const numberMatch = displayName.match(/\b\d{3}\b/);
    if (!numberMatch) {
      return null;
    }
    return Number(numberMatch[0]);
  }
}
