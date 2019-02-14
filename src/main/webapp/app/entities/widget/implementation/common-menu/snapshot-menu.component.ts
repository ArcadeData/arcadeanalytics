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
