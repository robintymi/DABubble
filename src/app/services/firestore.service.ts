import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  doc,
  docData,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
  orderBy,
  query,
} from '@angular/fire/firestore';
import {
  Observable,
  catchError,
  combineLatest,
  map,
  of,
  switchMap,
} from 'rxjs';
export interface Channel {
  id?: string;
  title?: string;
  description?: string;
}
export interface ChannelAttachment {
  title?: string;
  description?: string;
  linkLabel?: string;
  linkHref?: string;
  badgeLabel?: string;
}

export interface ThreadReply {
  id?: string;
  author?: string;
  avatar?: string;
  text?: string;
  createdAt?: Timestamp;
  isOwn?: boolean;
}

export interface ThreadDocument {
  id?: string;
  channelTitle?: string;
  author?: string;
  avatar?: string;
  text?: string;
  createdAt?: Timestamp;
}

export interface ChannelMessage {
  id?: string;
  author?: string;
  avatar?: string;
  createdAt?: Timestamp;
  text?: string;
  replies?: number;
  lastReplyAt?: Timestamp;
  tag?: string;
  attachment?: ChannelAttachment;
}

export interface DirectMessage {
  id: string;
  name: string;
  email?: string | null;
  photoUrl?: string | null;
}

export interface DirectMessageEntry {
  id?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  text?: string;
  createdAt?: Timestamp;
}
export interface ChannelMember {
  id: string;
  name: string;
  avatar: string;
  subtitle?: string;
  addedAt?: Timestamp;
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private readonly firestore = inject(Firestore);

  // Feste Dokument-ID für die Thread-Metadaten, damit der Pfad eine gerade Segmentzahl hat:
  // channels/{channelId}/messages/{messageId}/thread/{THREAD_DOC_ID}
  private static readonly THREAD_DOC_ID = 'meta';

  getChannels(): Observable<Channel[]> {
    const channelsCollection = collection(this.firestore, 'channels');

    return collectionData(channelsCollection, { idField: 'id' }).pipe(
      map((channels) => channels as Channel[])
    );
  }

  getChannelsForUser(userId: string): Observable<Channel[]> {
    return this.getChannels().pipe(
      switchMap((channels) => {
        if (!channels.length) {
          return of<Channel[]>([]);
        }

        const channelsWithMembers$ = channels
          .filter((channel): channel is Channel & { id: string } => !!channel.id)
          .map((channel) =>
            this.getChannelMembers(channel.id).pipe(
              map((members) => ({ channel, members }))
            )
          );

        if (!channelsWithMembers$.length) {
          return of<Channel[]>([]);
        }

        return combineLatest(channelsWithMembers$).pipe(
          map((results) =>
            results
              .filter(
                ({ members }) =>
                  members.length > 0 &&
                  members.some((member) => member.id === userId)
              )
              .map(({ channel }) => channel)
          )
        );
      })
    );
  }

  getChannelMessages(channelId: string): Observable<ChannelMessage[]> {
    const messagesCollection = collection(
      this.firestore,
      `channels/${channelId}/messages`
    );

    return collectionData(messagesCollection, { idField: 'id' }).pipe(
      map((messages) =>
        (messages as Array<Record<string, unknown>>).map((message) => ({
          id: message['id'] as string,
          author: (message['author'] as string) ?? 'Unbekannter Nutzer',
          avatar:
            (message['avatar'] as string) ??
            'imgs/users/Property 1=Frederik Beck.svg',
          createdAt: message['createdAt'] as Timestamp,
          text: (message['text'] as string) ?? '',
          replies: (message['replies'] as number) ?? 0,
          lastReplyAt: message['lastReplyAt'] as Timestamp,
          tag: message['tag'] as string,
          attachment: message['attachment'] as ChannelAttachment,
        }))
      )
    );
  }

  async addChannelMessage(
    channelId: string,
    message: Partial<ChannelMessage> &
      Pick<ChannelMessage, 'text' | 'author' | 'avatar'>
  ): Promise<void> {
    const messagesCollection = collection(
      this.firestore,
      `channels/${channelId}/messages`
    );

    await addDoc(messagesCollection, {
      ...message,
      createdAt: serverTimestamp(),
      replies: message.replies ?? 0,
    });
  }

  async updateChannelMessage(
    channelId: string,
    messageId: string,
    payload: Partial<Pick<ChannelMessage, 'text'>>
  ): Promise<void> {
    const messageDoc = doc(
      this.firestore,
      `channels/${channelId}/messages/${messageId}`
    );

    await updateDoc(messageDoc, {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  }


  getFirstChannelTitle(): Observable<string> {
    return this.getChannels().pipe(
      map((channels) => {
        const [firstChannel] = channels;
        return firstChannel?.title ?? 'Unbenannter Channel';
      })
    );
  }

  getDirectMessages(): Observable<DirectMessage[]> {
    const usersCollection = collection(this.firestore, 'users');

    return collectionData(usersCollection, { idField: 'id' }).pipe(
      map((users) =>
        (
          users as Array<{
            id?: string;
            name?: string;
            email?: string | null;
            photoUrl?: string | null;
          }>
        ).map((user) => ({
          id: user.id ?? 'unbekannt',
          name: user.name ?? 'Unbenannter Nutzer',
          email: user.email ?? null,
          photoUrl: user.photoUrl ?? null,
        }))
      )
    );
  }

  getDirectConversationMessages(
    currentUserId: string,
    otherUserId: string
  ): Observable<DirectMessageEntry[]> {
    const conversationId = this.buildConversationId(currentUserId, otherUserId);
    const messagesCollection = collection(
      this.firestore,
      `directMessages/${conversationId}/messages`
    );
    const messagesQuery = query(messagesCollection, orderBy('createdAt', 'asc'));

    return collectionData(messagesQuery, { idField: 'id' }).pipe(
      map((messages) =>
        (messages as Array<Record<string, unknown>>).map((message) => ({
          id: message['id'] as string,
          authorId: message['authorId'] as string,
          authorName: (message['authorName'] as string) ?? 'Unbekannter Nutzer',
          authorAvatar:
            (message['authorAvatar'] as string) ?? 'imgs/default-profile-picture.png',
          text: (message['text'] as string) ?? '',
          createdAt: message['createdAt'] as Timestamp,
        }))
      ),
      catchError(() => of([]))
    );
  }

  async sendDirectMessage(
    currentUser: Pick<DirectMessageEntry, 'authorId' | 'authorName' | 'authorAvatar'> &
    { text: string },
    recipientId: string
  ): Promise<void> {
    const conversationId = this.buildConversationId(
      currentUser.authorId ?? '',
      recipientId
    );
    const messagesCollection = collection(
      this.firestore,
      `directMessages/${conversationId}/messages`
    );

    await addDoc(messagesCollection, {
      ...currentUser,
      text: currentUser.text,
      createdAt: serverTimestamp(),
    });
  }

  private buildConversationId(userA: string, userB: string): string {
    return [userA, userB].sort((a, b) => a.localeCompare(b)).join('__');
  }


  async createChannel(title: string, description?: string): Promise<string> {
    const trimmedTitle = title.trim();
    const trimmedDescription = description?.trim();

    const channelPayload: Record<string, unknown> = {
      title: trimmedTitle,
      createdAt: serverTimestamp(),
    };

    if (trimmedDescription) {
      channelPayload['description'] = trimmedDescription;
    }

    const channelsCollection = collection(this.firestore, 'channels');
    const newChannel = await addDoc(channelsCollection, channelPayload);

    return newChannel.id;
  }

  async updateChannel(
    channelId: string,
    payload: Partial<Pick<Channel, 'title' | 'description'>>
  ): Promise<void> {
    const updates: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      updates['title'] = payload.title.trim();
    }

    if (payload.description !== undefined) {
      updates['description'] = payload.description.trim();
    }

    if (!Object.keys(updates).length) {
      return;
    }

    const channelDoc = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelDoc, updates);
  }

  getChannelMembers(channelId: string): Observable<ChannelMember[]> {
    const membersCollection = collection(
      this.firestore,
      `channels/${channelId}/members`
    );

    return collectionData(membersCollection, { idField: 'id' }).pipe(
      map((members) =>
        (members as Array<Record<string, unknown>>).map((member) => ({
          id: (member['id'] as string) ?? 'unbekannt',
          name: (member['name'] as string) ?? 'Unbenannter Nutzer',
          avatar:
            (member['avatar'] as string) ?? 'imgs/users/placeholder.svg',
          subtitle: member['subtitle'] as string | undefined,
          addedAt: member['addedAt'] as Timestamp | undefined,
        }))
      )
    );
  }

  async upsertChannelMember(
    channelId: string,
    member: Pick<ChannelMember, 'id' | 'name' | 'avatar' | 'subtitle'>
  ): Promise<void> {
    const memberDoc = doc(
      this.firestore,
      `channels/${channelId}/members/${member.id}`
    );

    await setDoc(
      memberDoc,
      {
        ...member,
        addedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  getThreadReplies(
    channelId: string,
    messageId: string
  ): Observable<ThreadReply[]> {
    const repliesCollection = collection(
      this.firestore,
      `channels/${channelId}/messages/${messageId}/threads`
    );

    const repliesQuery = query(repliesCollection, orderBy('createdAt', 'asc'));

    return collectionData(repliesQuery, { idField: 'id' }).pipe(
      map((replies) =>
        (replies as Array<Record<string, unknown>>).map((reply) => ({
          id: reply['id'] as string,
          author: (reply['author'] as string) ?? 'Unbekannter Nutzer',
          avatar: (reply['avatar'] as string) ?? 'imgs/users/placeholder.svg',
          text: (reply['text'] as string) ?? '',
          createdAt: reply['createdAt'] as Timestamp,
          isOwn: reply['isOwn'] as boolean,
        }))
      )
    );
  }

  async addThreadReply(
    channelId: string,
    messageId: string,
    reply: Pick<ThreadReply, 'author' | 'avatar' | 'text' | 'isOwn'>
  ): Promise<void> {
    const repliesCollection = collection(
      this.firestore,
      `channels/${channelId}/messages/${messageId}/threads`
    );

    await addDoc(repliesCollection, {
      ...reply,
      createdAt: serverTimestamp(),
    });

    const messageDoc = doc(
      this.firestore,
      `channels/${channelId}/messages/${messageId}`
    );

    await updateDoc(messageDoc, {
      replies: increment(1),
      lastReplyAt: serverTimestamp(),
    });
  }
  async updateThreadReply(
    channelId: string,
    messageId: string,
    replyId: string,
    payload: Partial<Pick<ThreadReply, 'text'>>
  ): Promise<void> {
    const replyDoc = doc(
      this.firestore,
      `channels/${channelId}/messages/${messageId}/threads/${replyId}`
    );

    await updateDoc(replyDoc, {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  }

  async saveThread(
    channelId: string,
    messageId: string,
    payload: Pick<ThreadDocument, 'channelTitle' | 'author' | 'avatar' | 'text'>
  ): Promise<void> {
    const threadDoc = doc(
      this.firestore,
      `channels/${channelId}/messages/${messageId}/thread/${FirestoreService.THREAD_DOC_ID}`
    );

    await setDoc(
      threadDoc,
      {
        ...payload,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async updateThreadMeta(
    channelId: string,
    messageId: string,
    payload: Partial<Pick<ThreadDocument, 'text' | 'channelTitle'>>
  ): Promise<void> {
    const threadDoc = doc(
      this.firestore,
      `channels/${channelId}/messages/${messageId}/thread/${FirestoreService.THREAD_DOC_ID}`
    );

    await updateDoc(threadDoc, {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  }

  getThread(
    channelId: string,
    messageId: string
  ): Observable<ThreadDocument | null> {
    const threadDocRef = doc(
      this.firestore,
      `channels/${channelId}/messages/${messageId}/thread/${FirestoreService.THREAD_DOC_ID}`
    );

    return docData(threadDocRef, { idField: 'id' }).pipe(
      map((data) => (data as ThreadDocument) ?? null),
      catchError(() => of(null))
    );
  }
}
