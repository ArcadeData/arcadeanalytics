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
import { Router } from '@angular/router';

/**
 * This component allows a tabular analysis of data fetched from the datasource
 * through queries, full text search, class scan loading.
 */
@Component({
    selector: 'query-secondary-bar-chart-widget',
    templateUrl: './query-bar-chart-widget.component.html',
    styleUrls: ['./query-bar-chart-widget.component.scss']
})
export class QuerySecondaryBarChartWidgetComponent extends AbstractSecondaryBarChartWidgetComponent implements SecondaryWidget, OnDestroy {

    categoryProperty: string;
    valueProperty: string;

    // multi series nodes fetching
    multiSeriesSelectedCategoryProperty: string;
    multiSeriesSelectedValueProperty: string;
    multiSeriesSelectedClassProperties: string[];
    // multiSeriesLimitEnabled: boolean = true;
    // multiSeriesLimitForNodeFetching: number = 100;
    tableColumns: Object[] = [
        {
            id: 'categoryproperty',
            text: 'Category',
            width: '45%'
        },
        {
            id: 'valueProperty',
            text: 'Value',
            width: '45%'
        },
        // {
        //     id: 'Count',
        //     text: 'Count',
        //     width: '25%'
        // },
        {
            id: 'button',
            text: ''
        }
    ];
    multiSeriesName2info: Object = {};

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
        this.multiSeriesSelectedClass = 'Table';
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
        this.performFacetingForCurrentDataset();
    }

    runSeriesComputation(saveAfterUpdate?: boolean, mode?: string) {
        if (mode === 'single') {
            this.multiSeriesMode = false;
        } else if (mode === 'multi') {
            this.multiSeriesMode = true;
        }
        this.performFacetingForCurrentDataset();
    }

    // Override
    updateBarChartWidgetFromSnapshot(snapshot) {

        super.updateBarChartWidgetFromSnapshot(snapshot);

        if (snapshot['valueProperty']) {
            this.valueProperty = snapshot['valueProperty'];
        }

        this.updateMultiSeriesSelectedClassProperties();
    }

    // Override
    addNewMultiSeries() {
        const seriesName = this.multiSeriesSelectedCategoryProperty + '_' + this.multiSeriesSelectedValueProperty;
        this.multiSeriesName2info[seriesName] = {
            categoryProperty: this.multiSeriesSelectedCategoryProperty,
            valueProperty: this.multiSeriesSelectedValueProperty
        };
        this.multiSeriesSelectedCategoryProperty = undefined;
        this.multiSeriesSelectedValueProperty = undefined;
        this.multiSeriesMode = true;
    }

    // Override
    removeMultiSeries(seriesName) {
        delete this.multiSeriesName2info[seriesName];
        this.multiSeriesMode = true;
    }

    // Override
    updateMultiSeriesSelectedClassProperties() {
        this.multiSeriesSelectedProperty = undefined;
        this.multiSeriesSelectedClassProperties = [];
        this.multiSeriesSelectedClassProperties = this.getClassProperties(this.multiSeriesSelectedClass);
        if (this.multiSeriesSelectedClassProperties.length === 0) {
            this.notificationService.push('warning', 'No Property found', 'No property found for the current flat table.');
        }
    }

    // Override
    onDatasetUpdate(data: Object, metadata: Object) {

        super.onDatasetUpdate(data, metadata);
        this.updateMultiSeriesSelectedClassProperties();
    }

    /**
      * Faceting
      */

    /**
  * It performs the facetig for current dataset by querying elastic search
  * @param saveAfterUpdate
  */
    performFacetingForCurrentDataset(saveAfterUpdate?: boolean): void {

        this.series = [];
        this.xAxisCategories = [];
        this.barChartLegendData = [];
        this.barChartLegendDataSelected = {};

        if (this.multiSeriesMode) {
            const distribution = this.buildDistribution();

            for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {
                const currSeriesBarChartData = [];

                // legend data updating
                this.barChartLegendData.push(currSeriesName);
                this.barChartLegendDataSelected[currSeriesName] = true;
                const seriesDistribution = distribution[currSeriesName];
                if (!seriesDistribution) {
                    let message = 'No distribution is present for the \'' + currSeriesName + '\' series.';
                    message += this.checkThresholdsMessage;
                    console.log(message);
                    this.notificationService.push('warning', 'Distribution computation', message);
                    return;
                }

                const currSeries: Object = {
                    name: currSeriesName,
                    type: 'bar',
                    label: this.labelOptions,
                    emphasis: this.emphasisOptions
                };

                for (const currValue of Object.keys(seriesDistribution)) {
                    const currBarChartItem = seriesDistribution[currValue];
                    currSeriesBarChartData.push(currBarChartItem);
                    if (this.xAxisCategories.indexOf(currValue) < 0) {
                        this.xAxisCategories.push(currValue);
                    }
                }

                // injecting data into the current series
                currSeries['data'] = currSeriesBarChartData;
                // adding the single series
                this.series.push(currSeries);
            }

        } else {
            // just a series: categoryProperty_valueProperty
            const distribution = this.buildDistribution();
            const seriesBarChartData = [];

            const seriesName = this.buildSingleSeriesName();

            // legend data updating
            this.barChartLegendData.push(seriesName);
            this.barChartLegendDataSelected[seriesName] = true;
            const seriesDistribution = distribution[seriesName];
            if (!seriesDistribution) {
                let message = 'No distribution is present for the \'' + seriesName + '\' series.';
                message += this.checkThresholdsMessage;
                console.log(message);
                this.notificationService.push('warning', 'Distribution computation', message);
                return;
            }

            const currSeries: Object = {
                name: seriesName,
                type: 'bar',
                label: this.labelOptions,
                emphasis: this.emphasisOptions
            };

            for (const currValue of Object.keys(seriesDistribution)) {
                const currBarChartItem = seriesDistribution[currValue];
                seriesBarChartData.push(currBarChartItem);
                if (this.xAxisCategories.indexOf(currValue) < 0) {
                    this.xAxisCategories.push(currValue);
                }
            }

            // injecting data into the current series
            currSeries['data'] = seriesBarChartData;
            // adding the single series
            this.series.push(currSeries);

        }

        this.stopSpinner();

        this.updateBarChart(true);

        // updating to-save flag
        this.toSave = true;

        if (saveAfterUpdate) {
            this.saveAll(true);
        }
    }

    buildDistribution(): Object {

        const globalDistribution = {};

        if (this.multiSeriesMode) {
            for (const seriesName of Object.keys(this.multiSeriesName2info)) {
                const currSeriesInfo = this.multiSeriesName2info[seriesName];
                const currCategoryProperty = currSeriesInfo['categoryProperty'];
                const currValueyProperty = currSeriesInfo['valueProperty'];
                const currSeriesDistribution = {};
                for (const elem of this.currentDataset['elements']) {
                    const record = elem['data']['record'];
                    currSeriesDistribution[record[currCategoryProperty]] = record[currValueyProperty];
                }
                globalDistribution[seriesName] = currSeriesDistribution;
            }
        } else {
            const seriesName = this.buildSingleSeriesName();
            const currSeriesDistribution = {};
            for (const elem of this.currentDataset['elements']) {
                const record = elem['data']['record'];
                currSeriesDistribution[record[this.categoryProperty]] = record[this.valueProperty];
            }
            globalDistribution[seriesName] = currSeriesDistribution;
        }
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
     * Modals handling
     */

    // Override
    resetSingleSeriesSettings() {
        this.categoryProperty = undefined;
        this.valueProperty = undefined;
    }

    /**
     * Saving
     */

    // Override
    buildSnapshotObject(): Object {

        const jsonForSnapshotSaving = {
            series: this.series,
            xAxisCategories: this.xAxisCategories,
            barChartLegendData: this.barChartLegendData,
            barChartLegendDataSelected: this.barChartLegendDataSelected,
            multiSeriesName2info: this.multiSeriesName2info,
            currentDataset: this.currentDataset,
            dataSourceMetadata: this.dataSourceMetadata,
            currentFaceting: this.currentFaceting,
            selectedClass: this.selectedClass,
            limitEnabled: this.limitEnabled,
            limitForNodeFetching: this.limitForNodeFetching,
            multiSeriesMode: this.multiSeriesMode,
            selectedClassProperties: this.selectedClassProperties,
            categoryProperty: this.categoryProperty,
            valueProperty: this.valueProperty,
            multiSeriesLimitEnabled: this.multiSeriesLimitEnabled,
            multiSeriesLimitForNodeFetching: this.multiSeriesLimitForNodeFetching,
            showLegend: this.showLegend,
            yAxisType: this.yAxisType,
            labelOptions: this.labelOptions,
            xAxisLabelOptions: this.xAxisLabelOptions,
            yAxisLabelOptions: this.yAxisLabelOptions,
        };

        const perspective: Object = {
            barChartTabActive: this.barChartTabActive,
            datasourceTabActive: this.datasourceTabActive,
        };
        jsonForSnapshotSaving['perspective'] = perspective;

        return jsonForSnapshotSaving;
    }
}
