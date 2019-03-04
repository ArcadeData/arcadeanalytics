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
import { Component, OnInit, OnDestroy, OnChanges, AfterViewInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { WidgetService } from '../..';
import { NotificationService } from 'app/shared';

@Component({
    selector: 'snapshot-menu',
    templateUrl: './snapshot-menu.component.html',
    styleUrls: ['./snapshot-menu.component.scss']
})
export class SnapshotMenuComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

    @Input() widgetId: number;
    @Output() snapshotLoaded: EventEmitter<Object> = new EventEmitter();
    snapshotNames: string[];
    loadedSnapshot: Object;

    constructor(private widgetService: WidgetService,
        private notificationService: NotificationService) {
        this.snapshotNames = [];
    }

    ngOnInit() {}

    ngOnDestroy() {}

    ngAfterViewInit() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.widgetId) {
            this.loadSnapshotsNames();
        }
    }

    loadSnapshotsNames() {
        this.widgetService.loadSnapshotsNames(this.widgetId).subscribe((res: string[]) => {
            this.snapshotNames = res;
        });
    }

    loadSnapshotByName(snaphotName: string) {
        const request = {
            fileName: snaphotName
        };
        this.widgetService.loadSnapshot(this.widgetId, request).subscribe((snapshot: Object) => {
            this.loadedSnapshot = snapshot;
            this.snapshotLoaded.emit(this.loadedSnapshot);
        this.loadedSnapshot = undefined;
        });
    }

}
