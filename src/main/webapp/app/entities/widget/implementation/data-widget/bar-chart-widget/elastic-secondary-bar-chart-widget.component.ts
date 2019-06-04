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
    Component, OnDestroy, ChangeDetectorRef, NgZone
} from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';
import { JhiEventManager } from 'ng-jhipster';
import { AbstractSecondaryBarChartWidgetComponent } from './abstract-secondary-bar-chart-widget.component';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { SecondaryWidget } from '../../secondary-widget';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * This component allows a tabular analysis of data fetched from the datasource
 * through queries, full text search, class scan loading.
 */
@Component({
    selector: 'elastic-secondary-bar-chart-widget',
    templateUrl: './elastic-bar-chart-widget.component.html',
    styleUrls: ['./elastic-bar-chart-widget.component.scss']
})
export class ElasticSecondaryBarChartWidgetComponent extends AbstractSecondaryBarChartWidgetComponent implements SecondaryWidget, OnDestroy {

    constructor(
        protected ngZone: NgZone,
        protected principal: Principal,
        protected widgetService: WidgetService,
        protected notificationService: NotificationService,
        protected dataSourceService: DataSourceService,
        protected eventManager: JhiEventManager,
        protected cdr: ChangeDetectorRef,
        protected modalService: BsModalService,
        protected base64Service: Base64Service,
        protected widgetEventBusService: WidgetEventBusService,
        protected router: Router) {

        super(ngZone, principal, widgetService, notificationService, dataSourceService, eventManager, cdr, modalService, base64Service, widgetEventBusService, router);
    }

    ngAfterViewInit() {
        this.performAdditionalInit();

        // sidebar height
        if (!this.embedded) {
            this.maxSidebarHeight = this.widgetHeight;
        } else {
            this.adjustWidgetHeightToEmbeddingIframeHeight();
        }

        if (this.minimizedView) {
            this.requestDatasetPropagation();
        }
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.dashboardPanelResizedSubscriber);
        this.unsubscribeToEventBus();
    }

    handleSelectedPropertyModelChanging() {
        this.startSpinner();
        this.multiSeriesMode = false;
        this.updateSettingsSliderUpperValue().subscribe((correctlyUpdated: boolean) => {
            this.performFacetingForCurrentDataset();
        });
    }

    runSeriesComputation(saveAfterUpdate?: boolean, mode?: string) {
        if (mode === 'single') {
            this.multiSeriesMode = false;
        } else if (mode === 'multi') {
            this.multiSeriesMode = true;
        }
        this.performFacetingForCurrentDataset(saveAfterUpdate);
    }

    // @Override
    updateBarChartWidgetFromSnapshot(snapshot) {

        super.updateBarChartWidgetFromSnapshot(snapshot);

        if (snapshot['currentDataset']) {
            this.currentDataset = snapshot['currentDataset'];
        }
    }

    /**
      * Faceting
      */

    performFacetingForCurrentDataset(saveAfterUpdate?: boolean): void {

        const currentDatasetIds: string[] = [];
        this.currentDataset['elements'].forEach((element) => {
            if (!element['data']['hidden']) {
                currentDatasetIds.push(element['data']['id']);
            }
        });

        const classes: string[] = [];
        const fields: string[] = [];
        if (!this.multiSeriesMode) {
            classes.push(this.selectedClass);
            fields.push(this.selectedProperty);
        } else {
            for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {
                const currClassMultiSeriesOption = this.multiSeriesName2info[currSeriesName];
                const currClassName = currClassMultiSeriesOption['className'];
                const currPropertyName = currClassMultiSeriesOption['property'];
                if (classes.indexOf(currClassName) < 0) {
                    classes.push(currClassName);
                }
                if (fields.indexOf(currPropertyName) < 0) {
                    fields.push(currPropertyName);
                }
            }
        }

        if (this.dataSource && this.dataSource['indexing'] &&
            this.dataSource['indexing'].toString() === 'INDEXED') {
            this.widgetService.fetchFacetsForDataset(this.widget['dataSourceId'], currentDatasetIds, classes, fields, undefined, undefined,
            this.minDocCount, this.maxValuesPerField).subscribe((res: Object) => {
                this.currentFaceting = res;
                if (!this.multiSeriesMode) {
                    if (this.selectedClass && this.selectedProperty) {
                        this.updateBarChartFromFaceting(res);
                    }
                } else {
                    this.updateBarChartFromFaceting(res);
                }
                if (saveAfterUpdate) {
                    this.saveAll(true);
                }
            }, (err: HttpErrorResponse) => {
                this.handleError(err.error, 'Filter Menu updating');
            });
        }
    }
}
