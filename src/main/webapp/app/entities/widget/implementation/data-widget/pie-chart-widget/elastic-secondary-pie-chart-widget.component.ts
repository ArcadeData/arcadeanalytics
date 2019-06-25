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
import { Observable } from 'rxjs';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';
import { JhiEventManager } from 'ng-jhipster';
import { AbstractSecondaryPieChartWidgetComponent } from './abstract-secondary-pie-chart-widget.component';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { SecondaryWidget } from '../../secondary-widget';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * This component allows a tabular analysis of data fetched from the datasource
 * through queries, full text search, class scan loading.
 */
@Component({
    selector: 'elastic-secondary-pie-chart-widget',
    templateUrl: './elastic-pie-chart-widget.component.html',
    styleUrls: ['./elastic-pie-chart-widget.component.scss']
})
export class ElasticSecondaryPieChartWidgetComponent extends AbstractSecondaryPieChartWidgetComponent implements SecondaryWidget, OnDestroy {

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
        this.updateSettingsSliderUpperValue().subscribe((correctlyUpdated: boolean) => {
            this.performSeriesComputationForCurrentDataset();
        });
    }

    runSeriesComputation(saveAfterUpdate?: boolean) {
        this.performSeriesComputationForCurrentDataset(saveAfterUpdate);
    }

    // @Override
    updatePieChartWidgetFromSnapshot(snapshot) {

        super.updatePieChartWidgetFromSnapshot(snapshot);

        if (snapshot['currentDataset']) {
            this.currentDataset = snapshot['currentDataset'];
        }
    }

    /**
     * It performs the series computation by using the faceting retrieved by querying elastic search
     * @param saveAfterUpdate
     */
    performSeriesComputationForCurrentDataset(saveAfterUpdate?: boolean): void {

        const currentDatasetIds: string[] = [];
        this.currentDataset['elements'].forEach((element) => {
            if (!element['data']['hidden']) {
                currentDatasetIds.push(element['data']['id']);
            }
        });
        const classes: string[] = [this.selectedClass];
        const fields: string[]  = [this.selectedProperty];
        if (this.dataSource && this.dataSource['indexing'] &&
            this.dataSource['indexing'].toString() === 'INDEXED') {
            this.widgetService.fetchFacetsForDataset(this.widget['dataSourceId'], currentDatasetIds, classes, fields, undefined, undefined,
                this.minDocCount, this.maxValuesPerField).subscribe((res: Object) => {
                    this.currentFaceting = res;
                    if (this.selectedClass && this.selectedProperty) {
                        this.updatePieChartFromFaceting(res);
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
