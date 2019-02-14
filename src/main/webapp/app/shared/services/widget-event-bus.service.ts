import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { MessageType } from 'app/entities/widget';

interface Message {
    channel: string;
    data: any;
}

@Injectable({ providedIn: 'root' })
export class WidgetEventBusService {

    private message: Subject<Message>;

    constructor() {
        this.message = new Subject<Message>();
    }

    public publish<T>(messageType: MessageType, message: T): void {
        const channel = messageType;
        this.message.next({ channel: channel, data: message });
    }

    public getMessage(messageType: MessageType): Observable<any> {
        const channel = messageType;
        const message = this.message.filter((m) => m['channel'] === channel).map((m) => m['data']);

        return message;
    }

}
