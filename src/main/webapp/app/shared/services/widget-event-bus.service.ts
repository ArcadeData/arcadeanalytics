/*-
 * #%L
 * Arcade Analytics
 * %%
 * Copyright (C) 2018 - 2019 ArcadeAnalytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
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
