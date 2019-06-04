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
import { AbstractSecondaryPieChartWidgetComponent } from './abstract-secondary-pie-chart-widget.component';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { SecondaryWidget } from '../../secondary-widget';
import { Router } from '@angular/router';

/**
 * This component allows a tabular analysis of data fetched from the datasource
 * through queries, full text search, class scan loading.
 */
@Component({
    selector: 'query-secondary-pie-chart-widget',
    templateUrl: './query-pie-chart-widget.component.html',
    styleUrls: ['./query-pie-chart-widget.component.scss']
})
export class QuerySecondaryPieChartWidgetComponent extends AbstractSecondaryPieChartWidgetComponent implements SecondaryWidget, OnDestroy {

    valueProperty: string;

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
        this.selectedClass = 'Table';
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

    pause() {
        console.log('pause');
    }

    handleSelectedPropertyModelChanging() {
        this.startSpinner();
        this.performFacetingForCurrentDataset();
    }

    runSeriesComputation() {
        this.performFacetingForCurrentDataset();
    }

    // @Override
    updatePieChartWidgetFromSnapshot(snapshot) {

        super.updatePieChartWidgetFromSnapshot(snapshot);

        if (snapshot['valueProperty']) {
            this.valueProperty = snapshot['valueProperty'];
        }
    }

    /**
      * Faceting
      */

    /**
     * It performs the facetig for current dataset by querying elastic search
     * @param saveAfterUpdate
     */
    performFacetingForCurrentDataset(saveAfterUpdate?: boolean): void {

        const propertyValues = {};
        const distribution = {};

        for (const elem of this.currentDataset['elements']) {
            const record = elem['data']['record'];
            distribution[record[this.selectedProperty]] = record[this.valueProperty];
        }
        propertyValues[this.selectedProperty] = distribution;

        const faceting = {
            Table: {
                doc_count: undefined,
                propertyValues: propertyValues
            }
        };

        this.updatePieChartFromFaceting(faceting);
        if (saveAfterUpdate) {
            this.saveAll(true);
        }
    }

    // Override
    buildSnapshotObject(): Object {

        const jsonForSnapshotSaving = super.buildSnapshotObject();
        jsonForSnapshotSaving['valueProperty'] = this.valueProperty;

        return jsonForSnapshotSaving;
    }
}
