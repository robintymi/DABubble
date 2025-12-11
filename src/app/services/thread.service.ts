import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ThreadMessage {
    id: string;
    author: string;
    avatar: string;
    timestamp: string;
    text: string;
    isOwn?: boolean;
}

export interface ThreadContext {
    root: ThreadMessage;
    replies: ThreadMessage[];
}

export interface ThreadSource {
    id?: string;
    author: string;
    avatar: string;
    time: string;
    text: string;
}

@Injectable({ providedIn: 'root' })
export class ThreadService {
    private readonly threadSubject = new BehaviorSubject<ThreadContext | null>(null);
    readonly thread$ = this.threadSubject.asObservable();



    openThread(source: ThreadSource): void {
        const id = this.generateId();
        const thread: ThreadContext = {
            root: {
                id: source.id ?? id,
                author: source.author,
                avatar: source.avatar,
                timestamp: source.time,
                text: source.text,
            },
            replies: [],
        };

        this.threadSubject.next(thread);
    }

    addReply(reply: Omit<ThreadMessage, 'id' | 'timestamp'>): void {
        const current = this.threadSubject.value;
        if (!current) return;

        const timestamp = new Date();
        const formatter = new Intl.DateTimeFormat('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const nextReply: ThreadMessage = {
            ...reply,
            id: this.generateId(),
            timestamp: formatter.format(timestamp),
        };

        this.threadSubject.next({ ...current, replies: [...current.replies, nextReply] });
    }

    reset(): void {
        this.threadSubject.next(null);
    }

    private generateId(): string {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}