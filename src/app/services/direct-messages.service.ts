import { inject, Injectable } from '@angular/core';
import { collection, deleteDoc, getDocs, query, where, Firestore } from '@angular/fire/firestore';
import { NOTIFICATIONS } from '../notifications';

@Injectable({ providedIn: 'root' })
export class DirectMessagesService {
  private firestore = inject(Firestore);

  async deleteAllDirectMessagesByParticipant(userId: string): Promise<void> {
    const conversationsSnap = await getDocs(
      query(collection(this.firestore, 'directMessages'), where('participants', 'array-contains', userId))
    );

    const results = await Promise.allSettled(
      conversationsSnap.docs.map(async (conversationDoc) => {
        const messagesSnap = await getDocs(collection(conversationDoc.ref, 'messages'));
        await Promise.all(messagesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)));

        const readStatusSnap = await getDocs(collection(conversationDoc.ref, 'readStatus'));
        await Promise.all(readStatusSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)));

        await deleteDoc(conversationDoc.ref);
      })
    );

    const failures = results.filter((result) => result.status === 'rejected');
    results.forEach((result) => console.error(NOTIFICATIONS.DIRECT_MESSAGES_DELETE_FAILED, result));

    if (failures.length) {
      throw new Error(NOTIFICATIONS.DIRECT_MESSAGES_DELETE_FAILED);
    }
  }
}
