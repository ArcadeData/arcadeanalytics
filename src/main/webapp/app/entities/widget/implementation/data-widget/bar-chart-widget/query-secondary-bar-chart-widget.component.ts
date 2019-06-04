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

        const propertyValues = {};
        const distribution = {};

        if (!this.multiSeriesMode) {
            for (const elem of this.currentDataset['elements']) {
                const record = elem['data']['record'];
                distribution[record[this.selectedProperty]] = record[this.valueProperty];
            }
            propertyValues[this.selectedProperty] = distribution;
        } else {

            for (const seriesName of Object.keys(this.multiSeriesName2info)) {
                const currSeries = this.multiSeriesName2info[seriesName];
                const currCategoryProperty = currSeries['categoryProperty'];
                const currValueyProperty = currSeries['valueProperty'];
                for (const elem of this.currentDataset['elements']) {
                    const record = elem['data']['record'];
                    distribution[record[currCategoryProperty]] = record[currValueyProperty];
                }
                propertyValues[currCategoryProperty] = distribution;
            }
        }

        const faceting = {
            Table: {
                doc_count: undefined,
                propertyValues: propertyValues
            }
        };

        this.updateBarChartFromFaceting(faceting);
        if (saveAfterUpdate) {
            this.saveAll(true);
        }
    }

    /* Override
     *
     * It updates the bar chart data according to the faceting passed as param.
     * If no faceting is passed as input, then the last loaded faceting will be used.
     */
    updateBarChartFromFaceting(faceting?: any) {

        this.stopSpinner();

        if (!faceting) {
            faceting = this.currentFaceting;
        }

        // updating bar chart data

        if (this.multiSeriesMode) {
            // multi series case: multiple classes and properties

            // single series settings reset
            this.resetSingleSeriesSettings();

            this.series = [];
            this.xAxisCategories = [];
            this.barChartLegendData = [];
            this.barChartLegendDataSelected = {};

            // updating xAxisCategories, used to order the counts
            for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {

                const currClassFaceting = faceting['Table']['propertyValues'];

                let addXAxisCategories = true;
                if (!currClassFaceting) {
                    const message = 'No faceting is present for query resulset.';
                    console.log(message);
                    this.notificationService.push('warning', 'Distribution computation', message);
                    addXAxisCategories = false;
                }
                const currPropertyName = this.multiSeriesName2info[currSeriesName]['categoryProperty'];
                const currPropertyFaceting = currClassFaceting[currPropertyName];
                if (!currPropertyFaceting) {
                    const message = 'No faceting is present for \'' + currPropertyName + '\' property of the query resulset.';
                    console.log(message);
                    this.notificationService.push('warning', 'Distribution computation', message);
                    addXAxisCategories = false;
                }

                if (addXAxisCategories) {
                    for (const currPropertyValue of Object.keys(currPropertyFaceting)) {
                        if (this.xAxisCategories.indexOf(currPropertyValue) < 0) {
                            this.xAxisCategories.push(currPropertyValue);
                        }
                    }
                }
            }
            // sorting the array
            this.xAxisCategories.sort();

            for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {      // series name is built as: <tableProperty1>_<tableProperty2>

                const currClassFaceting = faceting['Table']['propertyValues'];
                const currPropertyName = this.multiSeriesName2info[currSeriesName]['categoryProperty'];
                const currPropertyFaceting = currClassFaceting[currPropertyName];

                // legend data updating
                if (this.barChartLegendData.indexOf(currSeriesName) < 0) {
                    this.barChartLegendData.push(currSeriesName);
                    this.barChartLegendDataSelected[currSeriesName] = true;
                }

                const currSeries: Object = {
                    name: currSeriesName,
                    type: 'bar',
                    label: this.labelOptions,
                    emphasis: this.emphasisOptions
                };

                const currSeriesBarChartData = [];
                if (currPropertyFaceting) {
                    for (const currValueProperty of this.xAxisCategories) {
                        if (currPropertyFaceting[currValueProperty]) {
                            const currBarChartItem = currPropertyFaceting[currValueProperty];
                            currSeriesBarChartData.push(currBarChartItem);
                        } else {
                            // the current property faceting of the current series has not the property value, then we have to add 0 as default value
                            currSeriesBarChartData.push(0);
                        }
                    }
                } else {
                    // faceting is not present because of an error or because it was filtered out, then let's jump it
                    for (const currValueProperty of this.xAxisCategories) {
                        const currBarChartItem = 0;
                        currSeriesBarChartData.push(currBarChartItem);
                    }
                }

                // injecting data into the current series
                currSeries['data'] = currSeriesBarChartData;
                // adding the single series
                this.series.push(currSeries);
            }

            // TODO
        } else {

            this.series = [];

            // single series case: single class and single property
            if (faceting && faceting[this.selectedClass]) {

                const currSeriesBarChartData = [];
                this.xAxisCategories = [];
                this.barChartLegendData = [];
                this.barChartLegendDataSelected = {};

                const selectedClassFaceting = faceting[this.selectedClass]['propertyValues'];
                if (!selectedClassFaceting) {
                    const message = 'No faceting is present for the current selected class.';
                    console.log(message);
                    this.notificationService.push('warning', 'Distribution computation', message);
                    return;
                }
                const selectedPropertyFaceting = selectedClassFaceting[this.selectedProperty];
                if (!selectedPropertyFaceting) {
                    const message = 'No faceting is present for the current selected property.';
                    console.log(message);
                    this.notificationService.push('warning', 'Distribution computation', message);
                    return;
                }

                // legend data updating
                this.barChartLegendData.push(this.selectedClass);
                this.barChartLegendDataSelected[this.selectedClass] = true;

                const currSeries: Object = {
                    name: this.selectedClass,
                    type: 'bar',
                    label: this.labelOptions,
                    emphasis: this.emphasisOptions
                };
                for (const currValueProperty of Object.keys(selectedPropertyFaceting)) {
                    const currBarChartItem = selectedPropertyFaceting[currValueProperty];
                    currSeriesBarChartData.push(currBarChartItem);
                    if (this.xAxisCategories.indexOf(currValueProperty) < 0) {
                        this.xAxisCategories.push(currValueProperty);
                    }
                }

                // injecting data into the current series
                currSeries['data'] = currSeriesBarChartData;
                // adding the single series
                this.series.push(currSeries);

            } else {
                const message: string = 'Faceting data not correcly retrieved for the ' + this.selectedClass + ' class.';
                this.notificationService.push('warning', 'Bar Chart Update', message);
            }
        }

        this.updateBarChart(true);

        // updating to-save flag
        this.toSave = true;
    }

    /**
     * Modals handling
     */

     // Override
    resetSingleSeriesSettings() {
        this.selectedProperty = undefined;
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
            selectedProperty: this.selectedProperty,
            valueProperty: this.valueProperty,
            multiSeriesLimitEnabled: this.multiSeriesLimitEnabled,
            multiSeriesLimitForNodeFetching: this.multiSeriesLimitForNodeFetching,
            showLegend: this.showLegend,
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
