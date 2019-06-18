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

    categoryProperty: string;
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

        if (snapshot['categoryProperty']) {
            this.categoryProperty = snapshot['categoryProperty'];
        }

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

        this.pieChartData = [];
        this.pieChartLegendData = [];
        this.pieChartLegendDataSelected = {};

        // just a series: categoryProperty_valueProperty
        const distribution = this.buildDistribution();
        const seriesName = this.buildSingleSeriesName();

        const seriesDistribution = distribution[seriesName];
        if (!seriesDistribution) {
            let message = 'No distribution is present for the \'' + seriesName + '\' series.';
            message += this.checkThresholdsMessage;
            console.log(message);
            this.notificationService.push('warning', 'Distribution computation', message);
            return;
        }

        for (const currValue of Object.keys(seriesDistribution)) {
            const currPieChartItem = {
                name: currValue,
                value: seriesDistribution[currValue]
            };
            this.pieChartData.push(currPieChartItem);

            // legend data updating
            this.pieChartLegendData.push(currValue);
            this.pieChartLegendDataSelected[currValue] = true;
        }

        this.stopSpinner();

        this.updatePieChart();

        // updating to-save flag
        this.toSave = true;

        if (saveAfterUpdate) {
            this.saveAll(true);
        }
    }

    buildDistribution(): Object {

        const globalDistribution = {};
        const seriesName = this.buildSingleSeriesName();
        const currSeriesDistribution = {};
        for (const elem of this.currentDataset['elements']) {
            const record = elem['data']['record'];
            currSeriesDistribution[record[this.categoryProperty]] = record[this.valueProperty];
        }
        globalDistribution[seriesName] = currSeriesDistribution;
        return globalDistribution;
    }

    /**
     * Builds the name for a single series according to a specific logic:
     * seriesName = <categoryProperty>_<valueProperty>
     */
    buildSingleSeriesName(): string {
        return this.categoryProperty + '_' + this.valueProperty;
    }

    /**
     * Saving
     */

    // Override
    buildSnapshotObject(): Object {

        const jsonForSnapshotSaving = {
            pieChartData: this.pieChartData,
            pieChartLegendData: this.pieChartLegendData,
            pieChartLegendDataSelected: this.pieChartLegendDataSelected,
            currentDataset: this.currentDataset,
            dataSourceMetadata: this.dataSourceMetadata,
            currentFaceting: this.currentFaceting,
            selectedClass: this.selectedClass,
            limitEnabled: this.limitEnabled,
            limitForNodeFetching: this.limitForNodeFetching,
            selectedClassProperties: this.selectedClassProperties,
            categoryProperty: this.categoryProperty,
            valueProperty: this.valueProperty,
            showLegend: this.showLegend,
            showLabels: this.showLabels,
            labelPosition: this.labelPosition,
            minDocCount: this.minDocCount,
            maxValuesPerField: this.maxValuesPerField,
            minDocCountSliderUpperValue: this.minDocCountSliderUpperValue,
            maxValuesPerFieldSliderUpperValue: this.maxValuesPerFieldSliderUpperValue
        };

        const perspective: Object = {
            pieChartTabActive: this.pieChartTabActive,
            datasourceTabActive: this.datasourceTabActive,
        };
        jsonForSnapshotSaving['perspective'] = perspective;

        return jsonForSnapshotSaving;
    }
}
