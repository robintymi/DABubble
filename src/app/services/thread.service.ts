import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, of, switchMap } from 'rxjs';
import { FirestoreService, ThreadReply as FirestoreThreadReply } from './firestore.service';

export interface ThreadMessage {
    id: string;
    author: string;
    avatar: string;
    timestamp: string;
    text: string;
    isOwn?: boolean;
}

export interface ThreadContext {
    channelId: string;
    channelTitle: string;
    root: ThreadMessage;
    replies: ThreadMessage[];
}

export interface ThreadSource {
    id?: string;
    channelId: string;
    channelTitle: string;
    author: string;
    avatar: string;
    time: string;
    text: string;
}

@Injectable({ providedIn: 'root' })
export class ThreadService {
    private readonly firestoreService = inject(FirestoreService);
    private readonly threadSubject = new BehaviorSubject<ThreadContext | null>(null);
    readonly thread$: Observable<ThreadContext | null> = this.threadSubject.pipe(
        switchMap((context) => {
            if (!context?.channelId || !context.root.id) return of(null);

            return this.firestoreService
                .getThreadReplies(context.channelId, context.root.id)
                .pipe(
                    map((replies) => ({
                        ...context,
                        replies: replies.map((reply) => this.toThreadMessage(reply)),
                    }))
                );
        })
    );

    openThread(source: ThreadSource): void {
        const id = this.generateId();
        this.threadSubject.next({
            channelId: source.channelId,
            channelTitle: source.channelTitle,
            root: {
                id: source.id ?? id,
                author: source.author,
                avatar: source.avatar,
                timestamp: source.time,
                text: source.text,
            },
            replies: [],
        });
    }

    addReply(reply: Omit<ThreadMessage, 'id' | 'timestamp'>): void {
        const current = this.threadSubject.value;
        if (!current?.root.id) return;

        void this.firestoreService.addThreadReply(current.channelId, current.root.id, {
            ...reply,
        });
    }

    reset(): void {
        this.threadSubject.next(null);
    }

    private toThreadMessage(reply: FirestoreThreadReply): ThreadMessage {
        const createdAt = this.resolveTimestamp(reply);
        return {
            id: reply.id ?? this.generateId(),
            author: reply.author ?? 'Unbekannter Nutzer',
            avatar: reply.avatar ?? 'imgs/users/placeholder.svg',
            timestamp: this.formatTime(createdAt),
            text: reply.text ?? '',
            isOwn: reply.isOwn,
        };
    }

    private resolveTimestamp(message: FirestoreThreadReply): Date {
        if (message.createdAt && 'toDate' in message.createdAt) {
            return (message.createdAt as unknown as { toDate: () => Date }).toDate();
        }

        return new Date();
    }

    private formatTime(date: Date): string {
        const formatter = new Intl.DateTimeFormat('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
        });

        return formatter.format(date);
    }

    private generateId(): string {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}