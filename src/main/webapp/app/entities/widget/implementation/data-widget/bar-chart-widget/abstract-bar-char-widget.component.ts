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
    OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges, SimpleChanges,
    ChangeDetectorRef, TemplateRef, ViewChild, ViewContainerRef, NgZone
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, WidgetEventBusService, Principal } from '../../../../../shared';
import * as $ from 'jquery';
import { Observable } from 'rxjs';
import { JhiEventManager } from 'ng-jhipster';
import { DataWidgetComponent } from '../datawidget.component';
import { DataSourceService } from '../../../../data-source/data-source.service';

import * as echarts from 'echarts';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { DataSource } from 'app/entities/data-source';
import { SnapshotMenuComponent } from '../..';
import { Router } from '@angular/router';

const fileSaver = require('file-saver');
const elementResizeEvent = require('element-resize-event');

export abstract class AbstractBarChartWidgetComponent extends DataWidgetComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges {

    @ViewChild('minDocCountSlider') minDocCountSlider: any;
    @ViewChild('maxValuesPerFieldSlider') maxValuesPerFieldSlider: any;

    // classes names (both edges and nodes even though the datasource is a graph)
    allClassesNames: string[];

    // nodes fetching
    selectedClass: string;
    selectedClassProperties: string[];
    selectedProperty: string;
    limitEnabled: boolean = true;
    limitForNodeFetching: number = 100;

    // bar chart data
    barChartContainer;
    barChart;
    series: Object[];
    xAxisCategories: string[];
    barChartLegendData: string[];
    barChartLegendDataSelected: Object;
    currentFaceting: Object;

    // analysis
    modalRef: BsModalRef;
    startingPopoverMessage: string = 'Start your analysis by choosing a class, then specify a property.';
    startingPopoverMustBeOpen: boolean = true;  // use to force the opening or closure of the popover

    // snapshot menu
    @ViewChild('snapshotMenu') snapshotMenu: SnapshotMenuComponent;

    // multi series nodes fetching
    multiSeriesMode: boolean = false;
    multiSeriesSelectedClass: string;
    multiSeriesSelectedClassProperties: string[];
    multiSeriesSelectedProperty: string;
    multiSeriesLimitEnabled: boolean = true;
    multiSeriesLimitForNodeFetching: number = 100;
    tableColumns: Object[] = [
        {
            id: 'class',
            text: 'Class',
            width: '32.5%'
        },
        {
            id: 'Property',
            text: 'Property',
            width: '32.5%'
        },
        {
            id: 'Count',
            text: 'Count',
            width: '25%'
        },
        {
            id: 'button',
            text: ''
        }
    ];
    multiSeriesName2info: Object = {};

    // perspective
    barChartTabActive: boolean = true;
    datasourceTabActive: boolean = false;

    // layout options
    showLegend: boolean = true;
    maxSidebarHeight: string;

    // slider configs
    rotateLabelsSliderConfig = {
        behaviour: 'drag',
        connect: true,
        start: [90],
        keyboard: false,  // same as [keyboard]='true'
        step: 1,
        range: {
            min: -90,
            max: 90
        }
    };
    labelsDistanceSliderConfig = {
        behaviour: 'drag',
        connect: true,
        start: [0],
        keyboard: false,  // same as [keyboard]='true'
        step: 1,
        range: {
            min: 0,
            max: 100
        }
    };

    // bar chart layout option adopted for each series
    labelOptions: Object;
    xAxisLabelOptions: Object;
    yAxisLabelOptions: Object;

    emphasisOptions: Object = {
        label: {
            fontWeight: 'bold',
            z: 5
        }
    };

    // settings
    minDocCount: number = 1;
    maxValuesPerField: number = 100;

    // settings sliders configs
    minDocCountSliderConfig: any;
    maxValuesPerFieldSliderConfig: any;
    MIN_DOC_COUNT_SLIDER_UPPER_VALUE_DEFAULT: number = 1000;
    minDocCountSliderUpperValue: number = this.MIN_DOC_COUNT_SLIDER_UPPER_VALUE_DEFAULT;
    MAX_VALUES_PER_FIELD_SLIDER_UPPER_VALUE: number = 1000;
    maxValuesPerFieldSliderUpperValue: number = this.MAX_VALUES_PER_FIELD_SLIDER_UPPER_VALUE;

    // popovers
    positionTip: string = 'Label position relating to the bar.';
    rotateTip: string = 'Rotate label, from -90 degree to 90, positive value represents rotate anti-clockwise.';
    alignTip: string = 'Horizontal alignment of text.';
    verticalAlignTip: string = 'Vertical alignment of text.';
    distanceTip: string = 'Distance to the host bar. Not considered when \'inside\' position value is set.';

    axisRotateTip: string = `Rotation degree of axis label from -90 degree to 90, which is especially useful when there is no enough space for category axis.
    Positive value represents rotate anti-clockwise.`;
    minDocCountTip: string = `Include in each series just all the values for the selected properties with cardinality (number of occurrences)
         greater than or equal to the specified threshold.<br/>
        Thus all the value properties with cardinality below the set threshold will be excluded from the distribution.`;
    maxValuesPerFieldTip: string = `Include in each series just the first <i>n</i> values (where <i>n</i> is the specified threshold)
         for the selected properties with greater cardinality.<br/>
        In the single series case the set threshold corresponds to the maximum number of bars that can be rendered in the chart.<br/>
        That is not always true for the multiseries case, as the threshold is not applied globally, but for each specific class-property pair.`;

    public outerAccordion: string = 'outer-accordion';
    public innerAccordion: string = 'inner-accordion';

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

        super(principal, widgetService, notificationService, dataSourceService, eventManager, cdr, modalService, base64Service, widgetEventBusService, router);
    }

    /**
     * Abstract methods
     */
    abstract handleSelectedPropertyModelChanging(): void;
    abstract runSeriesComputation(): void;

    ngOnInit() {

        // widget id init
        this.widgetId = this.widget['id'];
        this.fileName = this.widget['name'];

        // loading datasource, then the snapshot
        const datasourceId = this.widget['dataSourceId'];
        if (!this.embedded) {
            this.dataSourceService.find(datasourceId).subscribe((res: DataSource) => {
                const dataSource = res;
                this.dataSource = dataSource;
                this.checkDatasourceIndexingAlert();
            });
        }

        if (this.oldSnapshotToLoad) {
            // load snapshot
            this.loadSnapshot();
            this.startingPopoverMustBeOpen = false;
        } else {
            // first metadata request in order to fetch all the metadata about nodes and edges classes with the related cardinalities.
            // Performed just if the current widget is an independent widget.
            if (!this.minimizedView && !this.widget.primaryWidgetId) {
                this.dataSourceService.loadMetadata(datasourceId).subscribe((dataSourceMetadata: Object) => {
                    this.dataSourceMetadata = dataSourceMetadata;
                    this.updateClassesNamesAccordingMetadata();
                }, (error: HttpErrorResponse) => {
                    this.handleError(error.error, 'Metadata loading');
                });
            }
        }

        // initializing the search term observer
        this.searchTermObserver = this.searchTerm.subscribe((event) => {
            this.lastEmittedSearchTerm = event;
        });

        this.registerChangeInDashboards();

        // authorities and depending params init
        if (!this.embedded) {
            this.initParamsDependingOnUserIdentities();
        }

        // options init
        this.labelOptions = {
            formatter: this.labelFormatterFunction,
            show: false,
            position: 'inside',
            rotate: 90,
            align: 'center',
            verticalAlign: 'middle',
            distance: 0,
            fontSize: 11
        };

        this.xAxisLabelOptions = {
            show: true,
            rotate: 90,
            align: 'right',
            verticalAlign: 'middle'
        };

        this.yAxisLabelOptions = {
            show: true,
            rotate: 0,
            align: 'right',
            verticalAlign: 'middle'
        };

        // settings sliders configs
        this.minDocCountSliderConfig = {
            behaviour: 'drag',
            connect: true,
            start: this.minDocCount,
            keyboard: false,  // same as [keyboard]='true'
            step: 1,
            pageSteps: 10,  // number of page steps, defaults to 10
            range: {
                min: 1,
                max: this.minDocCountSliderUpperValue
            },
            pips: {
                mode: 'count',
                density: 10,
                values: 2,
                stepped: true
            }
        };

        this.maxValuesPerFieldSliderConfig = {
            behaviour: 'drag',
            connect: true,
            start: this.maxValuesPerField,
            keyboard: false,  // same as [keyboard]='true'
            step: 1,
            pageSteps: 10,  // number of page steps, defaults to 10
            range: {
                min: 1,
                max: this.maxValuesPerFieldSliderUpperValue
            },
            pips: {
                mode: 'count',
                density: 10,
                values: 2,
                stepped: true
            }
        };
    }

    ngOnChanges(changes: SimpleChanges): void {}

    ngOnDestroy() {
        this.eventManager.destroy(this.dashboardPanelResizedSubscriber);
    }

    ngAfterViewInit() {
        // defined in the secondary-bar-chart and independent-bar-chart classes
    }

    performAdditionalInit() {
        this.sidebarResetMenu();

        // possible overflow handling
        this.tooltipOnOverflow();

        // attach listener to resize event
        const elementId = '#widget-viewport_' + this.widgetId;
        const element = $(elementId).get(0);
        elementResizeEvent(element, () => {
            // TODO: resize table?
        });

        if (this.minimizedView) {
            // hide tabs
            (<any>$('.widget-viewport .tab-container ul')).css('display', 'none');
        }

        // bar chart init just if something was loaded from the snapshot
        if (this.snapshotLoaded) {
            this.initBarChart();
        }
    }

    ngAfterViewChecked() { }

    updateClassesNamesAccordingMetadata() {
        const nodesClassesNames: string[] = [...Object.keys(this.dataSourceMetadata['nodesClasses'])];
        nodesClassesNames.sort();
        const edgesClassesNames: string[] = [...Object.keys(this.dataSourceMetadata['edgesClasses'])];
        edgesClassesNames.sort();
        this.allClassesNames = nodesClassesNames.concat(edgesClassesNames);
    }

    registerChangeInDashboards() {
        this.dashboardPanelResizedSubscriber = this.eventManager.subscribe(
            'dashboardPanelResized',
            (response) => {
                if (response.content === this.widgetId) {
                    console.log('Bar Chart widget #' + this.widgetId + ' detected resize in minimized view.');
                }
            }
        );
    }

    initBarChart() {
        this.ngZone.runOutsideAngular(() => {
            this.barChartContainer = document.getElementById('barChart_' + this.widgetId);
            this.barChart = echarts.init(this.barChartContainer);
        });
        this.attachBarChartEvents();
    }

    attachBarChartEvents() {

        // attach listener to resize event
        elementResizeEvent(this.barChartContainer, () => {
            if (this.barChart) {
                this.barChart.resize();
            } else {
                console.log('Cannot resize the bar chart as is not present in the widget viewport.');
            }
        });

        this.barChart.on('legendselectchanged', (event) => {
            // updating selected items in bar chart legend
            this.barChartLegendDataSelected = event['selected'];
        });
    }

    /**
     * Snapshot, data and metadata handling
     */
    loadSnapshot() {
        this.startSpinner();
        if (this.embedded) {
            // use the open service to load the snapshot
            this.widgetService.loadSnapshotForEmbeddedWidget(this.widget['uuid']).subscribe((snapshot: Object) => {
                this.performSnapshotLoading(snapshot);
            }, (error: HttpErrorResponse) => {
                this.stopSpinner();
                this.notificationService.push('error', 'Widget not available', this.notSharedWidgetMessage);
            });
        } else {
            //  use the closed service to load the snpashot
            this.widgetService.loadSnapshot(this.widgetId).subscribe((snapshot: Object) => {
                this.performSnapshotLoading(snapshot);
            }, (error: HttpErrorResponse) => {
                this.stopSpinner();
                this.handleError(error.error, 'Snapshot loading');
            });
        }
    }

    performSnapshotLoading(snapshot) {
        setTimeout(() => {

            // small timeout just to allow spinner to start, otherwise cy loading interferes with angular variable
            // update process and the spinner does not start
            this.updateBarChartWidgetFromSnapshot(snapshot);
            this.updateClassesNamesAccordingMetadata();
        }, 10);
    }

    updateBarChartWidgetFromSnapshot(snapshot) {

        // if the pie chart is already initialised we are not performing the first loading,
        // then we have to destroy the chart instance before a new initialisation.
        if (this.barChart) {
            this.ngZone.runOutsideAngular(() => {
                this.barChart.dispose();
                this.barChart = undefined;
            });
        }

        /*
         * Loading bar chart data
         */

        this.series = snapshot['series'];
        this.xAxisCategories = snapshot['xAxisCategories'];
        this.barChartLegendData = snapshot['barChartLegendData'];
        this.barChartLegendDataSelected = snapshot['barChartLegendDataSelected'];
        this.currentFaceting = snapshot['currentFaceting'];

        /*
         * Loading metadata
         */

        this.dataSourceMetadata = snapshot['dataSourceMetadata'];

        /*
         * Loading data
         */

        if (snapshot['multiSeriesName2info']) {
            this.multiSeriesName2info = snapshot['multiSeriesName2info'];
        }

        /*
         * Loading options
         */

        if (!this.minimizedView && snapshot['perspective']) {
            this.barChartTabActive = snapshot['perspective']['barChartTabActive'];
            this.datasourceTabActive = snapshot['perspective']['datasourceTabActive'];
        }
        this.selectedClass = snapshot['selectedClass'];
        this.selectedClassProperties = snapshot['selectedClassProperties'];
        this.selectedProperty = snapshot['selectedProperty'];
        if (snapshot['minDocCountSliderUpperValue']) {
            this.minDocCountSliderUpperValue = snapshot['minDocCountSliderUpperValue'];
        }
        if (snapshot['maxValuesPerFieldSliderUpperValue']) {
            this.maxValuesPerFieldSliderUpperValue = snapshot['maxValuesPerFieldSliderUpperValue'];
        }

        this.limitEnabled = snapshot['limitEnabled'];
        this.limitForNodeFetching = snapshot['limitForNodeFetching'];
        this.multiSeriesMode = snapshot['multiSeriesMode'];
        this.multiSeriesLimitEnabled = snapshot['multiSeriesLimitEnabled'],
            this.multiSeriesLimitForNodeFetching = snapshot['multiSeriesLimitForNodeFetching'],
            this.showLegend = snapshot['showLegend'];
        this.xAxisLabelOptions = snapshot['xAxisLabelOptions'];
        this.yAxisLabelOptions = snapshot['yAxisLabelOptions'];
        this.labelOptions = snapshot['labelOptions'];
        // setting label formatter function
        this.labelOptions['formatter'] = this.labelFormatterFunction;
        // setting label options for each series
        if (this.series) {
            for (const currSeries of this.series) {
                currSeries['label'] = this.labelOptions;
            }
        }

        this.stopSpinner();

        // initializing bar chart according to just loaded data
        this.updateBarChart(true);

        // updating slider values if not in minimized view or embedded
        if (!this.minimizedView && !this.embedded) {
            this.updateSettingsSliderUpperValue().subscribe(() => {
                console.log('Thresholds updated.');
                if (snapshot['minDocCount']) {
                    this.minDocCount = snapshot['minDocCount'];
                }
                if (snapshot['maxValuesPerField']) {
                    this.maxValuesPerField = snapshot['maxValuesPerField'];
                }
                this.snapshotLoaded = true;
            });
        } else {
            this.snapshotLoaded = true;
        }
    }

    /**
     * Updates minDocCount and maxFieldPerValues settings, then return true if it succeeds, otherwise false.
     */
    updateSettingsSliderUpperValue(): Observable<boolean> {

        const classes: string[] = [];
        const fields: string[] = [];
        const minDocCount: number = 1;
        let maxValuesPerField: number;
        if (this.multiSeriesMode) {
            if (this.multiSeriesName2info) {
                if (Object.keys(this.multiSeriesName2info).length > 0) {
                    let maxCardinality = 0;
                    for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {
                        const currClassMultiSeriesInfo = this.multiSeriesName2info[currSeriesName];
                        const currClassName = currClassMultiSeriesInfo['className'];
                        const currPropertyName = currClassMultiSeriesInfo['property'];
                        if (classes.indexOf(currClassName) < 0) {
                            classes.push(currClassName);
                        }
                        if (fields.indexOf(currPropertyName) < 0) {
                            fields.push(currPropertyName);
                        }
                        if (this.dataSourceMetadata['nodesClasses'][currClassName]) {
                            const currClassCardinality = this.dataSourceMetadata['nodesClasses'][currClassName]['cardinality'];
                            if (currClassCardinality > maxCardinality) {
                                maxCardinality = currClassCardinality;
                            }
                        } else if (this.dataSourceMetadata['edgesClasses'][currClassName]) {
                            const currClassCardinality = this.dataSourceMetadata['edgesClasses'][currClassName]['cardinality'];
                            if (currClassCardinality > maxCardinality) {
                                maxCardinality = currClassCardinality;
                            }
                        }
                    }
                    maxValuesPerField = maxCardinality;
                } else {
                    // setting threshold according to default values, then updating sliders
                    this.minDocCountSliderUpperValue = this.MIN_DOC_COUNT_SLIDER_UPPER_VALUE_DEFAULT;
                    this.maxValuesPerFieldSliderUpperValue = this.MAX_VALUES_PER_FIELD_SLIDER_UPPER_VALUE;
                    this.minDocCount = 1;
                    this.maxValuesPerField = this.maxValuesPerFieldSliderUpperValue;
                    this.updateSettingsSlidersConfigRange();
                    return Observable.of(true);
                }
            } else {
                this.notificationService.push('warning', 'Faceting Threshold Computing', 'Missing information about set series.');
                return Observable.of(false);
            }
        } else {
            if (this.selectedClass && this.selectedProperty) {
                classes.push(this.selectedClass);
                fields.push(this.selectedProperty);
                if (this.dataSourceMetadata['nodesClasses'][this.selectedClass]) {
                    maxValuesPerField = this.dataSourceMetadata['nodesClasses'][this.selectedClass]['cardinality'];
                } else if (this.dataSourceMetadata['edgesClasses'][this.selectedClass]) {
                    maxValuesPerField = this.dataSourceMetadata['edgesClasses'][this.selectedClass]['cardinality'];
                } else {
                    this.notificationService.push('warning', 'Faceting Threshold Computing', 'Current class not present in datasource metadata, thresholds cannot be computed.');
                    return Observable.of(false);
                }
            } else {
                console.log('Faceting Threshold Computing', 'Class or property are undefined, thresholds cannot be computed.');
                return Observable.of(false);
            }
        }

        // Aggregate Call for faceting
        const errorTitle = 'Faceting Threshold Computing';
        if (this.dataSource && this.dataSource['indexing'] &&
            this.dataSource['indexing'].toString() === 'INDEXED') {
            return this.widgetService.fetchWholeFacetingForDatasource(this.widget['dataSourceId'], classes, fields, minDocCount, maxValuesPerField).map((res: Object) => {

                this.currentFaceting = res;
                if (this.multiSeriesMode) {

                    // get the max cardinality to set the minDocCountSliderUpperValue
                    const maxValuesOccurenciesPerClass: number[] = [];
                    const maxValuesPerClass: number[] = [];
                    for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {
                        const currClassMultiSeriesInfo = this.multiSeriesName2info[currSeriesName];
                        const currClassName = currClassMultiSeriesInfo['className'];
                        const currPropertyName = currClassMultiSeriesInfo['property'];
                        const propertyFaceting = res[currClassName]['propertyValues'][currPropertyName];
                        const arr = Object.keys(propertyFaceting).map((key) => {
                            return propertyFaceting[key];
                        });
                        const currMax = Math.max.apply(null, arr);
                        maxValuesOccurenciesPerClass.push(currMax);
                        maxValuesPerClass.push(Object.keys(propertyFaceting).length);
                    }

                    this.minDocCountSliderUpperValue = Math.max.apply(null, maxValuesOccurenciesPerClass);
                    this.maxValuesPerFieldSliderUpperValue = Math.max.apply(null, maxValuesPerClass);

                } else {
                    // get the max cardinality to set the minDocCountSliderUpperValue
                    const propertyFaceting = res[this.selectedClass]['propertyValues'][this.selectedProperty];
                    const arr = Object.keys(propertyFaceting).map((key) => {
                        return propertyFaceting[key];
                    });
                    this.minDocCountSliderUpperValue = Math.max.apply(null, arr);
                    // get the number of property values to set the maxValuesPerFieldSliderUpperValue
                    this.maxValuesPerFieldSliderUpperValue = Object.keys(propertyFaceting).length;
                }

                // setting the minDocCount and maxValuesPerField params according to the new range
                this.minDocCount = 1;
                this.maxValuesPerField = this.maxValuesPerFieldSliderUpperValue;

                this.updateSettingsSlidersConfigRange();
                return true;
            }, (error: HttpErrorResponse) => {
                this.handleError(error.error, errorTitle);
            });
        } else {
            this.notificationService.push('warning', errorTitle, 'Index datasource missing, thresholds cannot be computed.');
            return Observable.of(false);
        }
    }

    getMultiSeriesInfoByClassName(className: string) {
        if (this.multiSeriesName2info) {
            for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {
                if (this.multiSeriesName2info[currSeriesName]['className'] === className) {
                    return this.multiSeriesName2info[currSeriesName];
                }
            }
        }
        return undefined;
    }

    updateSettingsSlidersConfigRange() {
        const lowerValue: number = 1;
        if (this.minDocCountSlider) {
            if (this.minDocCountSliderUpperValue === lowerValue) {
                this.minDocCountSliderUpperValue++;
            }
            this.minDocCountSlider.slider.updateOptions({
                range: {
                    min: lowerValue,
                    max: this.minDocCountSliderUpperValue
                }
            });
        }
        if (this.maxValuesPerFieldSlider) {
            if (this.maxValuesPerFieldSliderUpperValue === lowerValue) {
                this.maxValuesPerFieldSliderUpperValue++;
            }
            this.maxValuesPerFieldSlider.slider.updateOptions({
                range: {
                    min: lowerValue,
                    max: this.maxValuesPerFieldSliderUpperValue
                }
            });
        }
    }

    /**
     * Bar Chart Handling
     */

    /*
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

                const currSeriesNamesSplits = currSeriesName.split('_');
                const currClassName = currSeriesNamesSplits[0];
                const currClassFaceting = faceting[currClassName]['propertyValues'];
                let addXAxisCategories = true;
                if (!currClassFaceting) {
                    const message = 'No faceting is present for \'' + currClassName + '\' class.';
                    console.log(message);
                    this.notificationService.push('warning', 'Distribution computation', message);
                    addXAxisCategories = false;
                }
                const currPropertyName = this.multiSeriesName2info[currSeriesName]['property'];
                const currPropertyFaceting = currClassFaceting[currPropertyName];
                if (!currPropertyFaceting) {
                    const message = 'No faceting is present for \'' + currPropertyName + '\' property of the \'' + currClassName + '\' class.';
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

            for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {

                const currSeriesNamesSplits = currSeriesName.split('_');
                const currClassName = currSeriesNamesSplits[0];
                const currClassFaceting = faceting[currClassName]['propertyValues'];
                const currPropertyName = this.multiSeriesName2info[currSeriesName]['property'];
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

    updateBarChart(updatingSeries?: boolean) {

        const option = {
            xAxis: {
                type: 'category',
                data: this.xAxisCategories,
                axisLabel: this.xAxisLabelOptions
            },
            yAxis: {
                type: 'value',
                axisLabel: this.yAxisLabelOptions
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'     // 'line' | 'shadow'
                },
                enterable: false,
                confine: true
            },
            grid: {
                containLabel: true
            },
            legend: {
                show: this.showLegend,
                type: 'scroll',
                orient: 'horizontal',
                formatter: this.legendLabelFormatterFunction,
                textStyle: {
                    fontSize: 11    // default is 12
                },
                data: this.barChartLegendData,
                selected: this.barChartLegendDataSelected
            },
            series: this.series
        };

        // use configuration item and data specified to show chart
        if (!this.barChart) {
            this.initBarChart();
        }
        if (this.barChart) {
            if (updatingSeries) {
                const currRenderingOptions = this.barChart.getOption();
                if (currRenderingOptions && currRenderingOptions['series']) {
                    this.barChart.clear();
                }
            }
            this.barChart.setOption(option);
        } else {
            console.log('Bar chart not ready yet, options cannot be set.');
        }
    }

    legendLabelFormatterFunction(value) {
        const numberOfChars = 30;
        let outputString: string = value;
        if (outputString.length > numberOfChars) {
            outputString = outputString.substring(0, numberOfChars);
            // deleting the last char if it is a blank space
            if (outputString.charAt(outputString.length - 1) === ' ') {
                outputString = outputString.substring(0, outputString.length - 1);
            }
            outputString = outputString + '...';
        }
        return outputString;
    }

    labelFormatterFunction(value) {
        const numberOfChars = 25;
        let outputString: string = value['name'];
        if (outputString.length > numberOfChars) {
            outputString = outputString.substring(0, numberOfChars);
            // deleting the last char if it is a blank space
            if (outputString.charAt(outputString.length - 1) === ' ') {
                outputString = outputString.substring(0, outputString.length - 1);
            }
            outputString = outputString + '...';
        }
        return outputString;
    }

    /**
     * Template Functions
     */

    handleSelectedClassModelChanging() {
        this.updateSelectedClassProperties();
    }

    updateSelectedClassProperties() {
        this.selectedProperty = undefined;
        this.selectedClassProperties = [];
        if (this.selectedClass) {
            this.selectedClassProperties = this.getClassProperties(this.selectedClass);
        } else {
            console.log('Cannot update properties as the selected class seems to be udefined.');
        }
        if (this.selectedClassProperties.length === 0) {
            this.notificationService.push('warning', 'No Property found', 'No property found for the selected class.');
        }
    }

    updateMultiSeriesSelectedClassProperties() {
        this.multiSeriesSelectedProperty = undefined;
        this.multiSeriesSelectedClassProperties = [];
        if (this.multiSeriesSelectedClass) {
            this.multiSeriesSelectedClassProperties = this.getClassProperties(this.multiSeriesSelectedClass);
        } else {
            console.log('Cannot update properties as the selected class seems to be udefined.');
        }
        if (this.multiSeriesSelectedClassProperties.length === 0) {
            this.notificationService.push('warning', 'No Property found', 'No property found for the selected class.');
        }
    }

    getClassProperties(className: string): string[] {
        const classProperties: string[] = [];
        let classesMetadata = this.dataSourceMetadata['nodesClasses'];
        if (!classesMetadata[className]) {
            classesMetadata = this.dataSourceMetadata['edgesClasses'];
        }
        if (!classesMetadata) {
            console.error('[getClassProperties] class not found.');
            return;
        }
        for (const propName of Object.keys(classesMetadata[className]['properties'])) {
            classProperties.push(propName);
        }
        return classProperties;
    }

    getMultiSeriesClassesNames() {
        const multiSeriesClassesNames: string[] = [];
        for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {
            const currSeriesNamesSplits = currSeriesName.split('_');
            const currClassName = currSeriesNamesSplits[0];
            if (multiSeriesClassesNames.indexOf(currClassName) < 0) {
                multiSeriesClassesNames.push(currClassName);
            }
        }
        return multiSeriesClassesNames;
    }

    addNewMultiSeriesClass() {
        const seriesName = this.multiSeriesSelectedClass + '_' + this.multiSeriesSelectedProperty;
        this.multiSeriesName2info[seriesName] = {
            className: this.multiSeriesSelectedClass,
            property: this.multiSeriesSelectedProperty
        };
        this.multiSeriesSelectedClass = undefined;
        this.multiSeriesSelectedProperty = undefined;
        this.multiSeriesMode = true;
        this.updateSettingsSliderUpperValue().subscribe(() => {
            console.log('Thresholds updated.');
        });
    }

    removeMultiSeriesClass(seriesName) {
        delete this.multiSeriesName2info[seriesName];
        this.multiSeriesMode = true;
        this.updateSettingsSliderUpperValue().subscribe(() => {
            console.log('Thresholds updated.');
        });
    }

    hideElements(elements, removeSelection: boolean) {

        for (const element of elements) {
            element['data']['hidden'] = true;
            if (removeSelection) {
                elements['selected'] = false;
            }
        }
    }

    //  Shows all the elements according to the elements collection passed as param.
    //  It calls the auxiliary method with the showConnectedEdges set true.
    showElements(elements) {
        for (const element of elements) {
            element['data']['hidden'] = false;
        }
    }

    /**
     * It performs all the operations that must be performed after the indexing process completion.
     */
    performOperationsAfterIndexingComplete() {
        // DO NOTHING
    }

    /**
     * Perspective
     */

    switchTab(justChosenTab: string) {
        if (justChosenTab === 'bar-chart') {
            this.barChartTabActive = true;
            this.datasourceTabActive = false;
        } else if (justChosenTab === 'datasource') {
            this.barChartTabActive = false;
            this.datasourceTabActive = true;
        }
    }

    /**
      * Theme limitless
      */

    closePopover(popoverName: string) {
        if (popoverName === 'startingPopover') {
            if (this.startingPopoverMustBeOpen) {
                this.startingPopoverMustBeOpen = false;
            }
        }
    }

    getEmptyWidgetMessageHeight() {
        const widgetHeight: number = parseInt(this.widgetHeight.replace('px', ''), 10);
        const top: string = widgetHeight / 3 + 'px';
        return top;
    }

    sidebarResetMenu() {

        // Add 'active' class to parent list item in all levels
        $('.navigation').find('li.active').parents('li').addClass('active');

        // Hide all nested lists
        $('.navigation').find('li').not('.active, .category-title').has('ul').children('ul').addClass('hidden-ul');

        // Highlight children links
        $('.navigation').find('li').has('ul').children('a').addClass('has-ul');

        $('.navigation-main').find('li').has('ul').children('a').unbind('click');
        $('.navigation-main').find('li').has('ul').children('a').on('click', function(e) {
            e.preventDefault();

            // Collapsible
            $(this).parent('li')
                .not('.disabled')
                .not($('.sidebar-xs')
                    .not('.sidebar-xs-indicator')
                    .find('.navigation-main')
                    .children('li'))
                .toggleClass('active')
                .children('ul')
                .slideToggle(250);

            // Accordion
            if ($('.navigation-main').hasClass('navigation-accordion')) {
                $(this).parent('li')
                    .not('.disabled')
                    .not($('.sidebar-xs')
                        .not('.sidebar-xs-indicator')
                        .find('.navigation-main')
                        .children('li'))
                    .siblings(':has(.has-ul)')
                    .removeClass('active')
                    .children('ul')
                    .slideUp(250);
            }
        });

        this.toggleOverflowMenu();
    }

    tooltipOnOverflow() {
        (<any>$('.mightOverflow')).bind('mouseover', function() {
            const $this = $(this);
            const width = (<any>$('span')).width();
            if (this.offsetWidth > width && !$this.attr('title')) {
                $this.attr('title', $this.text());
            }
        });
    }

    toggleSideBar() {

        if (this.sidebarCollapsed) {
            this.expandSidebar();
        } else {
            this.collapseSidebar();
        }
    }

    checkSidebarStatusOnExit() {
        if (this.sidebarCollapsed) {
            (<any>$('body')).removeClass('sidebar-xs');
        }
    }

    collapseSidebar() {

        const initialSidebarSize = (<any>$('.sidebar')).width();
        (<any>$('body')).addClass('sidebar-xs');
        const finalSidebarSize = (<any>$('.sidebar')).width();

        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.toggleOverflowMenu();
    }

    expandSidebar() {

        const initialSidebarSize = (<any>$('.sidebar')).width();
        (<any>$('body')).removeClass('sidebar-xs');
        const finalSidebarSize = (<any>$('.sidebar')).width();

        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.toggleOverflowMenu();
    }

    toggleOverflowMenu() {

        if (this.sidebarCollapsed) {
            // remove 'vertical-overflow-scroll' from element with 'cell-content-wrapper' class
            $('#sidebar-dynamic').removeClass('vertical-overflow-scroll');

            // add 'submenu-vertical-overflow' to element with 'hidden-ul' class
            $('.hidden-ul').addClass('submenu-vertical-overflow');
        } else {
            // add 'vertical-overflow-scroll' to element with 'cell-content-wrapper' class
            $('#sidebar-dynamic').addClass('vertical-overflow-scroll');

            // remove 'submenu-vertical-overflow' from element with 'hidden-ul' class
            $('.hidden-ul').removeClass('submenu-vertical-overflow');
        }
    }

    /**
     * Modals handling
     */

    openQueryModal(template: TemplateRef<any>) {
        this.modalRef = this.modalService.show(template);
    }

    resetSingleSeriesSettings() {
        this.selectedClass = undefined;
        this.selectedClassProperties = undefined;
        this.selectedProperty = undefined;
    }

    /*
     * Save/export functions, snapshot loading
     */

    // saves both data and metadata
    saveAll() {

        const infoNotification = this.notificationService.push('info', 'Save', 'Saving the widget...', 3000, 'fa fa-spinner fa-spin');
        const delay: number = 10;

        setTimeout(() => {      // just to avoid the saving ops block the first notification message
            const jsonForSnapshotSaving = {
                series: this.series,
                xAxisCategories: this.xAxisCategories,
                barChartLegendData: this.barChartLegendData,
                barChartLegendDataSelected: this.barChartLegendDataSelected,
                multiSeriesName2info: this.multiSeriesName2info,
                dataSourceMetadata: this.dataSourceMetadata,
                currentFaceting: this.currentFaceting,
                selectedClass: this.selectedClass,
                limitEnabled: this.limitEnabled,
                limitForNodeFetching: this.limitForNodeFetching,
                multiSeriesMode: this.multiSeriesMode,
                selectedClassProperties: this.selectedClassProperties,
                selectedProperty: this.selectedProperty,
                multiSeriesLimitEnabled: this.multiSeriesLimitEnabled,
                multiSeriesLimitForNodeFetching: this.multiSeriesLimitForNodeFetching,
                showLegend: this.showLegend,
                labelOptions: this.labelOptions,
                xAxisLabelOptions: this.xAxisLabelOptions,
                yAxisLabelOptions: this.yAxisLabelOptions,
                minDocCount: this.minDocCount,
                maxValuesPerField: this.maxValuesPerField,
                minDocCountSliderUpperValue: this.minDocCountSliderUpperValue,
                maxValuesPerFieldSliderUpperValue: this.maxValuesPerFieldSliderUpperValue
            };

            const perspective: Object = {
                barChartTabActive: this.barChartTabActive,
                datasourceTabActive: this.datasourceTabActive,
            };
            jsonForSnapshotSaving['perspective'] = perspective;

            this.callSnapshotSave(jsonForSnapshotSaving, infoNotification);
        }, delay);
    }

    callSnapshotSave(jsonForSnapshotSaving: object, infoNotification): void {

        const jsonContent = JSON.stringify(jsonForSnapshotSaving);
        this.widgetService.updateWidget(this.widgetId, jsonContent).subscribe((res: HttpResponse<any>) => {
            if (res.status === 200 || res.status === 204) {
                if (infoNotification) {
                    const message: string = 'Data correctly saved.';
                    this.notificationService.updateNotification(infoNotification, 'success', 'Save', message, undefined, true);
                }

                // updating to-save flag
                this.toSave = false;

                // updating snapshot-menu
                if (this.snapshotMenu) {
                    this.snapshotMenu.loadSnapshotsNames();
                }
            } else {
                if (infoNotification) {
                    const message = 'Saving attempt failed.\n' + 'Response status: ' + res.status;
                    this.notificationService.updateNotification(infoNotification, 'error', 'Save', message, undefined, true);
                }
            }
        }, (error: HttpErrorResponse) => {
            if (infoNotification) {
                this.notificationService.updateNotification(infoNotification, 'error', 'Save', 'Saving attempt failed.', undefined, true);
            }
            console.log(error.message);
        });
    }

    barChartExport(content: any, exportType: string) {

        let blob = undefined;
        if (exportType === 'image/png' || exportType === 'image/jpg' || exportType === 'image/jpeg') {
            blob = this.base64Service.b64toBlob(content, exportType, 512);
        } else if (exportType === 'json') {
            this.exportAsJSON();
        } else {
            console.log('Error: export type not supported, just "png", "jpeg/jpg" and "json" allowed.');
        }
        exportType = exportType.slice(exportType.indexOf('/') + 1);
        const fileName = this.fileName + '.' + exportType;
        fileSaver.saveAs(blob, fileName);
    }

    exportAsJSON() {

        const seriesData = [];
        for (const currSeries of this.series) {
            const currSeriesItem: Object = {
                seriesName: currSeries['name'],
                data: currSeries['data']
            };
            seriesData.push(currSeriesItem);
        }

        const jsonExport = {
            xAxisValues: this.xAxisCategories,
            series: seriesData
        };
        const blob = new Blob([JSON.stringify(jsonExport, null, 2)], { type: 'text/plain;charset=utf-8' });
        const exportType = 'json';
        const fileName = this.fileName + '.' + exportType;
        fileSaver.saveAs(blob, fileName);
    }

}
