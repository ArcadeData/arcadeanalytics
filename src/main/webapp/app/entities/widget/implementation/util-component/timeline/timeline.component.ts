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
import {
    Component, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges, SimpleChanges,
    ChangeDetectorRef, Input, Output, EventEmitter
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { DataWidgetComponent } from '../../data-widget/datawidget.component';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';
import * as $ from 'jquery';
import { JhiEventManager } from 'ng-jhipster';
import { DataSourceService } from '../../../../data-source/data-source.service';

import * as vis from 'vis';
import { Router } from '@angular/router';

@Component({
    selector: 'timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent extends DataWidgetComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges {

    @Input() inputTimelineItems: Object[];

    // bounds
    @Input() lowerBoundDate: Date;
    @Input() upperBoundDate: Date;

    @Output() filterEmitter: EventEmitter<Object> = new EventEmitter();
    @Output() disableTimeFilterEmitter: EventEmitter<Object> = new EventEmitter();
    @Output() closeTimelineEmitter: EventEmitter<Object> = new EventEmitter();
    @Output() wrongClassConfigEmitter: EventEmitter<Object> = new EventEmitter();

    timeline: any = undefined;
    container: any = undefined;
    timelineLoaded: boolean = false;

    /**
     * Options
     */

    // sizing
    visTimelineWidth: string = '100%';
    visTimelineHeight: string = '110px';
    visTimelineMinHeight: string = '110px';
    visTimelineMaxHeight: string = '110px';
    ctrlCommandsMenuHeight: string = '33px';

    datasetItems: any = new vis.DataSet([]);

    options: Object = {
        min: this.lowerBoundDate,
        max: this.upperBoundDate,
        width: this.visTimelineWidth,
        height: this.visTimelineHeight,
        minHeight: this.visTimelineMinHeight,
        maxHeight: this.visTimelineMaxHeight,
        margin: {
            item: 20
        },
        clickToUse: false,
        verticalScroll: true,
        horizontalScroll: true,
        stack: false,
        zoomKey: 'ctrlKey'
    };

    // filtering window
    @Input() filteringWindowActive: boolean;
    @Input() firstBarTime: number;
    @Input() secondBarTime: number;
    @Output() filteringWindowStateChanged: EventEmitter<Object> = new EventEmitter();
    filteredItems: any = undefined;

    // go-to-date command
    goToDate: string = undefined;
    goToDateMin: string;
    goToDateMax: string;

    // to-save check flag
    toSave: boolean = false;

    constructor(protected principal: Principal,
        protected widgetService: WidgetService,
        protected notificationService: NotificationService,
        protected dataSourceService: DataSourceService,
        protected eventManager: JhiEventManager,
        protected cdr: ChangeDetectorRef,
        protected modalService: BsModalService,
        protected base64Service: Base64Service,
        protected widgetEventBusService: WidgetEventBusService,
        protected router: Router) {

        super(principal, widgetService, notificationService, dataSourceService, eventManager, cdr, modalService, base64Service, widgetEventBusService, router);
    }

    ngOnInit() {}

    ngOnDestroy() {}

    ngAfterViewInit() {}

    ngAfterViewChecked() {
        if (!this.timelineLoaded) {
            this.checkAndCleanInputDataset();
            if (this.inputTimelineItems.length > 0) {
                this.initTimeline();
            }
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.inputTimelineItems) {
            this.checkAndCleanInputDataset();
            this.datasetItems = new vis.DataSet(this.inputTimelineItems);
            if (this.timeline) {    // case: not the first loading, but an input update
                this.timeline.setItems(this.datasetItems);
                this.timeline.redraw();
                this.fitAllElementsInWindow();
            }
        }
        if (changes.lowerBoundDate) {
            if (changes.lowerBoundDate.currentValue !== null) {
                this.options['min'] = this.lowerBoundDate;
                if (this.timelineLoaded) {
                    this.restartTimeline();
                }
                this.goToDateMin = this.lowerBoundDate.toISOString().slice(0, 10);
            }
        }
        if (changes.upperBoundDate) {
            if (changes.upperBoundDate.currentValue !== null) {
                this.options['max'] = this.upperBoundDate;
                if (this.timelineLoaded) {
                    this.restartTimeline();
                }
                this.goToDateMax = this.upperBoundDate.toISOString().slice(0, 10);
            }
        }

    }

    initTimeline() {

        // bounds check
        if (!this.lowerBoundDate) {
            this.lowerBoundDate = new Date('1971-01-01');
        }
        if (!this.upperBoundDate) {
            this.upperBoundDate = new Date('2049-12-31');
        }
        this.options['min'] = this.lowerBoundDate;
        this.options['max'] = this.upperBoundDate;

        this.container = document.getElementById('timeline-chart');
        if (this.container) {
            this.timeline = new vis.Timeline(this.container, this.datasetItems, this.options);
            this.timelineLoaded = true;
        }

        this.attachTimelineEvents();

        // toggle filtering window if needed
        if (this.filteringWindowActive) {
            this.openFilteringWindow();
        }
    }

    restartTimeline() {
        if (this.timeline) {
            this.timeline.destroy();
            this.timelineLoaded = false;
            this.initTimeline();
        }
    }

    /**
     * It performs all the operations that must be performed after the indexing process completion.
     */
    performOperationsAfterIndexingComplete() {
        // DO NOTHING
    }

    setFilteringWindowBounds(firstBarTime: number, secondBarTime: number) {
        this.firstBarTime = firstBarTime;
        this.secondBarTime = secondBarTime;
    }

    checkAndCleanInputDataset() {
        const warningMessages: Object = {};
        let i: number = 0;
        while (i < this.inputTimelineItems.length) {
            const currTimelineItem = this.inputTimelineItems[i];
            const currClass = currTimelineItem['className'];

            // checking date value
            const validTimestamp = this.getValidDateTimestamp(currTimelineItem['start']);
            if (!validTimestamp) {
                this.inputTimelineItems.splice(i, 1);
                if (!warningMessages[currClass]) {
                    warningMessages[currClass] = 'The ' + currClass + ' class contains some invalid date values inside the specified ' +
                                                 'date property. Then some items will not be considered in the timeline.';
                }
                i--;
            } else {
                // overriding the start time with the date value
                this.inputTimelineItems[i]['start'] = new Date(validTimestamp);
            }
            i++;
        }

        if (Object.keys(warningMessages).length > 0) {
            this.notifyWarningMessages(warningMessages);

            for (const className of Object.keys(warningMessages)) {
                this.wrongClassConfigEmitter.emit({className: className});
            }
        }

        if (this.inputTimelineItems.length === 0) {

            // blocking the timeline loading and closing it
            this.timelineLoaded = true;  // ngAfterViewChecked disabled
            this.closeTimeline();
        }
    }

    closeTimeline() {
        this.closeTimelineEmitter.emit();
    }

    getValidDateTimestamp(dateValue: string) {
        const timestamp = Date.parse(dateValue);
        if (isNaN(timestamp)) {
            return undefined;
        }
        return timestamp;
    }

    notifyWarningMessages(warningMessages: Object) {
        for (const className of Object.keys(warningMessages)) {
            this.notificationService.push('warning', 'Timeline', warningMessages[className]);
        }
    }

    attachTimelineEvents() {
        this.timeline.on('timechanged', (properties) => {
            this.performTimelineFiltering(properties);
        });
        this.timeline.on('timechange', (properties) => {
            this.performTimelineFiltering(properties);
        });
    }

    performTimelineFiltering(properties) {
        if (this.filteringWindowActive) {

            if (properties['id'] === 'firstCustomTime') {
                this.firstBarTime = properties['time'].getTime();
            } else if (properties['id'] === 'secondCustomTime') {
                this.secondBarTime = properties['time'].getTime();
            }
            // update background
            if (this.firstBarTime <= this.secondBarTime) {
                this.updateBackgroundItem(this.firstBarTime, this.secondBarTime);
            } else {
                this.updateBackgroundItem(this.secondBarTime, this.firstBarTime);
            }

            // triggerring time slot filtering
            this.triggerFiltering();
        }
    }

    /**
     * Timeline menu commands
     */

     zoomIn() {
         this.timeline.zoomIn(0.2);
     }

     zoomOut() {
        this.timeline.zoomOut(0.2);
    }

    /**
     *  Move the timeline range with a given step
     * step = percentage of the timeline range that is moved.
     * step < 0 => Move left | step > 0 => Move right
     */
    moveTimelineRange(step) {
        const numberOfTicksInRange = this.getNumberOfTicksOnTimeline();
        const ticksToStep = (numberOfTicksInRange / 2) * step;
        const curWindow = this.timeline.getWindow();
        this.setRangeOnTimeline(curWindow.start.getTime() + ticksToStep, curWindow.end.getTime() + ticksToStep);
    }

    /**
     * Sets the range of the timeline to an end and start date
     */
    setRangeOnTimeline(startDate, endDate) {
        const startTime = this.getTimeOfDate(startDate);
        const endTime = this.getTimeOfDate(endDate);
        this.timeline.setWindow(startTime, endTime);
    }

    /**
     * Returns the total number of ticks that are visible on the timeline. Can be used to calculate positioning
     */
    getNumberOfTicksOnTimeline() {
        const curTWindow = this.timeline.getWindow();
        return curTWindow.end.getTime() - curTWindow.start.getTime();
    }

    /**
     *  Converts a date into a number of ticks
     */
    getTimeOfDate(date) {
        return isNaN(date)
    ? new Date(date).getTime() // Use the 'new Date(date)' to also parse strings
    : date; // Date is a number so we assume it's already been transformed to a number of ticks
    }

    modeToSelectedDate() {
        if (!isNaN( (new Date(this.goToDate)).getTime() ) ) {
            this.timeline.moveTo(this.goToDate);
        }
    }

    fitAllElementsInWindow() {
        this.timeline.fit();
    }

    toggleFilteringTimeWindow() {

        this.filteringWindowActive = !this.filteringWindowActive;

        if (this.filteringWindowActive) {
            this.openFilteringWindow();
        } else {
            this.closeFilteringWindow();
        }

        this.filteringWindowStateChanged.emit({
            filteringWindowActive: this.filteringWindowActive
        });
    }

    openFilteringWindow() {
        const distanceBetweenWindowBounds = this.getNumberOfTicksOnTimeline() / 100;
        const window = this.timeline.getWindow();
        if (!this.firstBarTime && !this.secondBarTime) {
            // setting default bounds if not set yet
            this.firstBarTime = window.start.getTime() + (distanceBetweenWindowBounds / 2);  // 0.5% of the total time window
            this.secondBarTime = window.end.getTime() - distanceBetweenWindowBounds;   // 1% of the total time window
        }

        // adding first and second custom times
        this.timeline.addCustomTime(this.firstBarTime, 'firstCustomTime');
        this.timeline.addCustomTime(this.secondBarTime, 'secondCustomTime');

        const filteringSlot = {
            id: 'filteringSlot',
            start: this.firstBarTime,
            end: this.secondBarTime,
            type: 'background'
        };
        this.addItem(filteringSlot);

        // triggerring time slot filtering
        this.triggerFiltering();
    }

    closeFilteringWindow() {
        this.timeline.removeCustomTime('firstCustomTime');
        this.timeline.removeCustomTime('secondCustomTime');
        this.removeItemById('filteringSlot');
        this.firstBarTime = undefined;
        this.secondBarTime = undefined;

        // triggerring time slot filtering
        this.disableFiltering();
    }

    addItem(item) {
        this.datasetItems.add(item);
    }

    removeItemById(itemId: string) {
        this.datasetItems.remove(itemId);
    }

    updateBackgroundItem(start, end) {
        this.datasetItems.update({
            id: 'filteringSlot',
            start: start,
            end: end,
            background: 'background'
        });
    }

    triggerFiltering() {
        this.filteredItems = this.filterItemsAccordingToFilteringWindow('in');
        this.emitFilteredElements();
    }

    filterItemsAccordingToFilteringWindow(filteringLogic): any {
        let filteredItems;

        if (filteringLogic === 'in') {
            filteredItems = this.datasetItems.get({
                filter: (item) => {
                    const time = new Date(item['start']);
                    if (this.firstBarTime <= this.secondBarTime) {
                        return (time.getTime() >= this.firstBarTime &&
                                time.getTime() <= this.secondBarTime &&
                                item['id'] !== 'filteringSlot');
                    } else {
                        return (time.getTime() >= this.secondBarTime &&
                                time.getTime() <= this.firstBarTime &&
                                item['id'] !== 'filteringSlot');
                    }
                }
            });
        } else if (filteringLogic === 'out') {
            filteredItems = this.datasetItems.get({
                filter: (item) => {
                    const time = new Date(item['start']);
                    if (this.firstBarTime <= this.secondBarTime) {
                        return (time.getTime() >= this.firstBarTime &&
                                time.getTime() <= this.secondBarTime &&
                                item['id'] !== 'filteringSlot');
                    } else {
                        return (time.getTime() >= this.secondBarTime &&
                                time.getTime() <= this.firstBarTime &&
                                item['id'] !== 'filteringSlot');
                    }
                }
            });
        } else {
            console.log('Error [TimelineWidget.filterItemsAccordingToFilteringWindow(..)]: wrong filtering logic.');
            return false;
        }
        return filteredItems;
    }

    emitFilteredElements() {

        const filteredElementsIds = this.filteredItems.map((item) => {
            return item['id'];
        });

        const newEvent: Object = {
            event: 'timeline-slot-applied',
            filteredIn: filteredElementsIds,
            timelineFilteringWindowStart: this.firstBarTime,
            timelineFilteringWindowEnd: this.secondBarTime
        };
        this.filterEmitter.emit(newEvent);
    }

    disableFiltering() {
        this.disableTimeFilterEmitter.emit();
    }

    loadSnapshot() {}

    saveAll() {}
}
