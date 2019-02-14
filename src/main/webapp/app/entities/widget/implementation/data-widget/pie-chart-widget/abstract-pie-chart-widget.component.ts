import {
    OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges, SimpleChanges,
    ChangeDetectorRef, TemplateRef, ViewChild, NgZone
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';
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
const elementResizeEvent = require('element-resize-event');
const fileSaver = require('file-saver');

export abstract class AbstractPieChartWidgetComponent extends DataWidgetComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges {

    @ViewChild('minDocCountSlider') minDocCountSlider: any;
    @ViewChild('maxValuesPerFieldSlider') maxValuesPerFieldSlider: any;

    // classes names (both edges and nodes even though the datasource is a graph)
    allClassesNames: string[];

    // nodes fetching
    selectedClass: string;
    limitEnabled: boolean = true;
    limitForNodeFetching: number = 100;

    // pie chart data
    pieChartContainer;
    pieChart;
    pieChartData: Object[];
    pieChartLegendData: string[];
    pieChartLegendDataSelected: Object;
    selectedClassProperties: string[];
    selectedProperty: string;
    currentFaceting: Object;

    // analysis
    modalRef: BsModalRef;
    startingPopoverMessage: string = 'Start your analysis by choosing a class, then specify a property.';
    startingPopoverMustBeOpen: boolean = true;  // use to force the opening or closure of the popover

    // snapshot menu
    @ViewChild('snapshotMenu') snapshotMenu: SnapshotMenuComponent;

    // perspective
    pieChartTabActive: boolean = true;
    datasourceTabActive: boolean = false;

    // layout options
    showLegend: boolean = true;
    showLabels: boolean = true;
    labelPosition: string = 'outside';
    maxSidebarHeight: string;
    radius: number = 75;

    // slider configs
    radiusSliderConfig = {
        behaviour: 'drag',
        connect: true,
        start: [this.radius],
        keyboard: false,  // same as [keyboard]='true'
        step: 1,
        range: {
            min: 10,
            max: 100
        }
    };

    // settings
    minDocCount: number = 5;
    maxValuesPerField: number = 100;

    // settings sliders configs
    minDocCountSliderConfig: any;
    maxValuesPerFieldSliderConfig: any;
    minDocCountSliderUpperValue: number = 1000;
    maxValuesPerFieldSliderUpperValue: number = 1000;

    // popovers
    minDocCountTip: string = `Include in the series just all the values for the selected properties with cardinality (number of occurrences)
         greater than or equal to the specified threshold.<br/>
        Thus all the value properties with cardinality below the set threshold will be excluded from the distribution.`;
    maxValuesPerFieldTip: string = `Include in the series just the first <i>n</i> values (where <i>n</i> is the specified threshold)
         for the selected properties with greater cardinality.<br/>
        The set threshold corresponds to the maximum number of slices that can be rendered in the chart.`;
    radiusTip: string = 'Pie chart radius length declared as percentage respect to the chart container. Allowed values from 10% to 100%.';

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
                this.dataSource = res;
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

        // pie chart init just if something was loaded from the snapshot
        if (this.snapshotLoaded) {
            this.initPieChart();
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
                    console.log('Pie Chart widget #' + this.widgetId + ' detected resize in minimized view.');
                }
            }
        );
    }

    initPieChart() {
        this.ngZone.runOutsideAngular(() => {
            this.pieChartContainer = document.getElementById('pieChart_' + this.widgetId);
            this.pieChart = echarts.init(this.pieChartContainer);
        });
        this.attachPieChartEvents();
    }

    attachPieChartEvents() {

        // attach listener to resize event
        elementResizeEvent(this.pieChartContainer, () => {
            if (this.pieChart) {
                this.pieChart.resize();
            } else {
                console.log('Cannot resize the pie chart as is not present in the widget viewport.');
            }
        });

        this.pieChart.on('legendselectchanged', (event) => {
            // updating selected items in pie chart legend
            this.pieChartLegendDataSelected = event['selected'];
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
            this.updatePieChartWidgetFromSnapshot(snapshot);
            this.updateClassesNamesAccordingMetadata();
        }, 10);
    }

    updatePieChartWidgetFromSnapshot(snapshot) {

        // if the pie chart is already initialised we are not performing the first loading,
        // then we have to destroy the chart instance before a new initialisation.
        if (this.pieChart) {
            this.ngZone.runOutsideAngular(() => {
                this.pieChart.dispose();
                this.pieChart = undefined;
            });
        }

        /*
         * Loading bar chart data
         */

        this.pieChartData = snapshot['pieChartData'];
        this.pieChartLegendData = snapshot['pieChartLegendData'];
        this.pieChartLegendDataSelected = snapshot['pieChartLegendDataSelected'];
        this.currentFaceting = snapshot['currentFaceting'];

        /*
         * Loading metadata
         */

        this.dataSourceMetadata = snapshot['dataSourceMetadata'];

        /*
         * Loading options
         */

        if (!this.minimizedView && snapshot['perspective']) {
            this.pieChartTabActive = snapshot['perspective']['pieChartTabActive'];
            this.datasourceTabActive = snapshot['perspective']['datasourceTabActive'];
        }
        this.selectedClass = snapshot['selectedClass'];
        this.limitEnabled = snapshot['limitEnabled'];
        this.limitForNodeFetching = snapshot['limitForNodeFetching'];
        this.selectedClassProperties = snapshot['selectedClassProperties'];
        this.selectedProperty = snapshot['selectedProperty'];
        this.showLegend = snapshot['showLegend'];
        this.showLabels = snapshot['showLabels'];
        this.labelPosition = snapshot['labelPosition'];
        if (snapshot['radius']) {
            this.radius = snapshot['radius'];
        }
        if (snapshot['minDocCountSliderUpperValue']) {
            this.minDocCountSliderUpperValue = snapshot['minDocCountSliderUpperValue'];
        }
        if (snapshot['maxValuesPerFieldSliderUpperValue']) {
            this.maxValuesPerFieldSliderUpperValue = snapshot['maxValuesPerFieldSliderUpperValue'];
        }

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

        this.stopSpinner();

        // initializing pie chart according to just loaded data
        this.updatePieChart();
    }

    /**
     * Updates minDocCount and maxFieldPerValues settings, then return true if it succeeds, otherwise false.
     */
    updateSettingsSliderUpperValue(): Observable<boolean> {
        const errorTitle: string = 'Faceting Threshold Computing';
        if (this.selectedClass && this.selectedProperty) {
            const classes: string[] = [this.selectedClass];
            const fields: string[] = [this.selectedProperty];
            const minDocCount: number = 1;  // we don't want filter out anything
            let maxValuesPerField: number;
            if (this.dataSourceMetadata['nodesClasses'][this.selectedClass]) {
                maxValuesPerField = this.dataSourceMetadata['nodesClasses'][this.selectedClass]['cardinality'];
            } else if (this.dataSourceMetadata['edgesClasses'][this.selectedClass]) {
                maxValuesPerField = this.dataSourceMetadata['edgesClasses'][this.selectedClass]['cardinality'];
            } else {
                this.notificationService.push('error', errorTitle, 'Current class not present in datasource metadata.');
            }
            if (this.dataSource && this.dataSource['indexing'] &&
                this.dataSource['indexing'].toString() === 'INDEXED') {
                return this.widgetService.fetchWholeFacetingForDatasource(this.widget['dataSourceId'], classes, fields, minDocCount, maxValuesPerField).map((res: Object) => {
                    this.currentFaceting = res;
                    // get the max cardinality to set the minDocCountSliderUpperValue
                    const propertyFaceting = res[this.selectedClass]['propertyValues'][this.selectedProperty];
                    const arr = Object.keys(propertyFaceting).map((key) => {
                        return propertyFaceting[key];
                    });
                    this.minDocCountSliderUpperValue = Math.max.apply(null, arr);
                    // get the number of property values to set the maxValuesPerFieldSliderUpperValue
                    this.maxValuesPerFieldSliderUpperValue = Object.keys(propertyFaceting).length;

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
        } else {
            console.log('[' + this.widget.name + '] Faceting Threshold Computing', 'Class or property are undefined, thresholds cannot be computed.');
            return Observable.of(false);
        }
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
     * Pie Chart Handling
     */

     /*
     * It updates the pie chart data according to the faceting passed as param.
     * If no faceting is passed as input, then the last loaded faceting will be used.
     */
    updatePieChartFromFaceting(faceting?: any) {

        this.stopSpinner();

        if (!faceting) {
            faceting = this.currentFaceting;
        }

        // updating pie chart data
        if (faceting && faceting[this.selectedClass]) {
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

            this.pieChartData = [];
            this.pieChartLegendData = [];
            this.pieChartLegendDataSelected = {};
            for (const currValueProperty of Object.keys(selectedPropertyFaceting)) {
                const currPieChartItem = {
                    name: currValueProperty,
                    value: selectedPropertyFaceting[currValueProperty]
                };
                this.pieChartData.push(currPieChartItem);

                // legend data updating
                this.pieChartLegendData.push(currValueProperty);
                this.pieChartLegendDataSelected[currValueProperty] = true;
            }

            this.updatePieChart();

            // updating to-save flag
            this.toSave = true;
        } else {
            const message: string = 'Faceting data not correcly retrieved for the ' + this.selectedClass + ' class.';
            this.notificationService.push('warning', 'Pie Chart Update', message);
        }
    }

    updatePieChart() {

        const radiusPercentage = this.radius + '%';

        const option = {
            tooltip : {
                trigger: 'item',
                formatter: '{b} : {c} <br/> ({d}%)',
                enterable: false,
                confine: true
            },
            legend: {
                show: this.showLegend,
                type: 'scroll',
                orient: 'vertical',
                right: 10,
                top: 20,
                bottom: 20,
                width: '200px',
                formatter: (value) => {
                    return this.buildTruncatedLabel(value, 20);
                },
                textStyle: {
                    fontSize: 11    // default is 12
                },
                data: this.pieChartLegendData,
                selected: this.pieChartLegendDataSelected
            },
            series: {
                type: 'pie',
                center: this.showLegend ? ['40%', '50%'] : ['50%', '50%'],
                radius : ['0%', radiusPercentage],
                selectedMode: 'multiple',
                selectedOffset: 20,
                label: {
                    formatter: (value) => {
                        return this.buildTruncatedLabel(value['name'], 25);
                    },
                    show: this.showLabels,
                    position: this.labelPosition,
                    fontSize: 11
                },
                labelLine: {
                    show: this.showLabels,
                    smooth: false,   // specifies if the label line is curved or not
                    emphasis: {
                        width: 1
                    }
                },
                emphasis: {
                    label: {
                        fontWeight: 'bold',
                        z: 5
                    }
                },
                data: this.pieChartData,
                formatter: '{b} : {c} <br/> ({d}%)'
            }
        };

        // use configuration item and data specified to show chart
        if (!this.pieChart) {
            this.initPieChart();
        }
        this.pieChart.setOption(option);
    }

    buildTruncatedLabel(inputString: string, numberOfChars: number) {
        if (inputString) {
            let outputString: string = inputString;
            if (outputString.length > numberOfChars) {
                outputString = outputString.substring(0, numberOfChars);
                // deleting the last char if it is a blank space
                if (outputString.charAt(outputString.length - 1) === ' ') {
                    outputString = outputString.substring(0, outputString.length - 1);
                }
                outputString = outputString + '...';
            }
            return outputString;
        } else {
            return undefined;
        }
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
        if (justChosenTab === 'pie-chart') {
            this.pieChartTabActive = true;
            this.datasourceTabActive = false;
        } else if (justChosenTab === 'datasource') {
            this.pieChartTabActive = false;
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

    /*
     * Save/export functions, snapshot loading
     */

    // saves both data and metadata
    saveAll() {

        const infoNotification = this.notificationService.push('info', 'Save', 'Saving the widget...', 3000, 'fa fa-spinner fa-spin');
        const delay: number = 10;

        setTimeout(() => {      // just to avoid the saving ops block the first notification message
            const jsonForSnapshotSaving = {
                pieChartData: this.pieChartData,
                pieChartLegendData: this.pieChartLegendData,
                pieChartLegendDataSelected: this.pieChartLegendDataSelected,
                dataSourceMetadata: this.dataSourceMetadata,
                currentFaceting: this.currentFaceting,
                selectedClass: this.selectedClass,
                limitEnabled: this.limitEnabled,
                limitForNodeFetching: this.limitForNodeFetching,
                selectedClassProperties: this.selectedClassProperties,
                selectedProperty: this.selectedProperty,
                showLegend: this.showLegend,
                showLabels: this.showLabels,
                labelPosition: this.labelPosition,
                radius: this.radius,
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

            this.callSnapshotSave(jsonForSnapshotSaving, infoNotification);
        }, delay);
    }

    callSnapshotSave(jsonForSnapshotSaving: Object, infoNotification): void {

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
            console.log(error.error);
        });
    }

    pieChartExport(content: any, exportType: string) {

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

        const blob = new Blob([JSON.stringify(this.pieChartData, null, 2)], { type: 'text/plain;charset=utf-8' });
        const exportType = 'json';
        const fileName = this.fileName + '.' + exportType;
        fileSaver.saveAs(blob, fileName);
    }
}
