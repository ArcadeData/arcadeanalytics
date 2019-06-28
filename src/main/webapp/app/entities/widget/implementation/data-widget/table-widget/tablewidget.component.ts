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
    ChangeDetectorRef, TemplateRef, ViewChild
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { PrimaryWidget } from '../../primary-widget';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';
import * as $ from 'jquery';
import { Subscription } from 'rxjs';
import { FilterMenuComponent } from '../../common-menu/filtermenu.component';
import { JhiEventManager } from 'ng-jhipster';
import { DataWidgetComponent, FetchingMode } from '../datawidget.component';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { TableComponent, SortingStatus } from '../../util-component/table/table.component';
import { DatasetUpdatedMessage, DatasetUpdatedMessageContent, SnapshotMenuComponent } from '../../..';
import { SubsetSelectionChangeMessageContent, MessageType } from '../../../event-message';
import { DataSource } from 'app/entities/data-source';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

const fileSaver = require('file-saver');
const elementResizeEvent = require('element-resize-event');

/**
 * This component allows a tabular analysis of data fetched from the datasource
 * through queries, full text search, class scan loading.
 */
@Component({
    selector: 'table-widget',
    templateUrl: './tablewidget.component.html',
    styleUrls: ['./tablewidget.component.scss']
})
export class TableWidgetComponent extends DataWidgetComponent implements PrimaryWidget, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges {

    subsetSelectionSubscription: Subscription;
    datasetPropagationRequestSubscription: Subscription;

    maxSidebarHeight: string;

    loadingGraphElements = [];     // used to store new graph elements retrieved with the last query/snapshot
    loadingGraphElementsPositions = {};     // used to store new graph elements retrieved with the last snapshot

    // classes names (both edges and nodes even though the datasource is a graph)
    nodesClassesNames: string[];
    edgesClassesNames: string[];
    allClassesNames: string[];
    // fetching mode
    appendLastResult: boolean = false;

    // columns name config
    classNameColumnIncluded: boolean = true;

    // querying
    lastFetchingMode: FetchingMode;
    modalRef: BsModalRef;
    currentQuery: string = '';
    skipIsolatedNodes: boolean = false;
    skipEdgesNotInDataset: boolean = false;
    includesNodesOfEdge: boolean = false;
    popoverMessage: string = 'Start your analysis by typing a query.';
    popoverMustBeOpen: boolean = true;  // use to force the opening or closure of the popover

    // auto update
    autoUpdate: boolean = false;
    minimumTimeoutWindow: number;
    autoUpdateIntervalWindow: number;
    autoUpdateInterval;  // timer used to trigger the new data fetching once the time window has completed
    autoUpdatePopover: string = `Use this flag to refresh data according to the last query.<br/>
                                You can state the time interval by specifying the desired number of seconds in the form below.<br/>
                                Append-last-result and auto-update flags cannot be both enabled.`;

    // flag stating if the current dataset must be propagated to potential secondary widgets
    newDatasetToPropagate: boolean = false;

    // table data
    @ViewChild('tableComponent') tableComponent: TableComponent;
    lastLoadedData: Object;
    lastLoadedColumns: Object[] = [];
    lastLoadedClasses: string[] = [];

    // filtering
    @ViewChild('filterMenuComponent') filterMenu: FilterMenuComponent;
    filters: Object[] = [];
    startingFilters: Object[];  // used to get the old filters from the snapshot and pass them to the filter menu ad init time

    // snapshot menu
    @ViewChild('snapshotMenu') snapshotMenu: SnapshotMenuComponent;

    // nodes fetching
    classType: string = 'node';
    classForDataFetching: string;
    limitForNodeFetching: number = 10;

    // perspective
    tableTabActive: boolean = true;
    datasourceTabActive: boolean = false;

    public outerAccordion: string = 'outer-accordion';
    public innerAccordion: string = 'inner-accordion';

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
        this.subscribeToEventBus();
    }

    subscribeToEventBus() {
        this.subsetSelectionSubscription = this.widgetEventBusService.getMessage(MessageType.SUBSET_SELECTION_CHANGE).subscribe((message) => {
            if (message.data['primaryWidgetId'] === this.widget.id) {
                this.onSubsetSelection(message.data);
            }
        });

        this.datasetPropagationRequestSubscription = this.widgetEventBusService.getMessage(MessageType.DATASET_PROPAGATION_REQUEST).subscribe((message) => {
            if (message.data['primaryWidgetId'] === this.widget.id) {
                if (this.oldSnapshotToLoad && !this.snapshotLoaded) {
                    // IGNORE THE MESSAGE: dataset will be propagated after the snapshot is loaded
                } else {
                    this.propagateDatasetTo(message.data['secondaryWidgetId']);
                }
            }
        });
    }

    unsubscribeToEventBus() {
        this.subsetSelectionSubscription.unsubscribe();
        this.datasetPropagationRequestSubscription.unsubscribe();
    }

    ngOnInit() {

        this.lastLoadedData = {
            elements: []
        };

        // widget id init
        this.widgetId = this.widget['id'];
        this.fileName = this.widget['name'];

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
            this.popoverMustBeOpen = false;
        } else {
            // first metadata request in order to fetch
            // all the metadata about nodes and edges classes with the related cardinalities
            if (!this.minimizedView) {
                this.dataSourceService.loadMetadata(datasourceId).subscribe((dataSourceMetadata: Object) => {
                    this.dataSourceMetadata = dataSourceMetadata;

                    this.setAllPropertyTableInclusionFlag(true);

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

        // autoupdate params init
        if (!this.embedded) {
            this.minimumTimeoutWindow = this.principal['userIdentity']['contract']['pollingInterval'];
            this.autoUpdateIntervalWindow = this.minimumTimeoutWindow;
        }
    }

    /**
     * It sets the 'included' flag for all the properties contained in the metadata with the value passed as paramter.
     * This flag is used to know if a property is enabled as column table.
     * @param value
     */
    setAllPropertyTableInclusionFlag(value: boolean) {
        for (const currClassName of Object.keys(this.dataSourceMetadata['nodesClasses'])) {
            for (const currPropName of Object.keys(this.dataSourceMetadata['nodesClasses'][currClassName]['properties'])) {
                this.dataSourceMetadata['nodesClasses'][currClassName]['properties'][currPropName]['included'] = value;
            }
        }
        for (const currClassName of Object.keys(this.dataSourceMetadata['edgesClasses'])) {
            for (const currPropName of Object.keys(this.dataSourceMetadata['edgesClasses'][currClassName]['properties'])) {
                this.dataSourceMetadata['edgesClasses'][currClassName]['properties'][currPropName]['included'] = value;
            }
        }
    }

    updateClassesNamesAccordingMetadata() {
        this.nodesClassesNames = [...Object.keys(this.dataSourceMetadata['nodesClasses'])];
        this.nodesClassesNames.sort();
        this.edgesClassesNames = [...Object.keys(this.dataSourceMetadata['edgesClasses'])];
        this.edgesClassesNames.sort();
        this.allClassesNames = this.nodesClassesNames.concat(this.edgesClassesNames);
    }

    registerChangeInDashboards() {
        this.dashboardPanelResizedSubscriber = this.eventManager.subscribe(
            'dashboardPanelResized',
            (response) => {
                if (response.content === this.widgetId) {
                    console.log('Graph widget #' + this.widgetId + ' detected resize in minimized view.');
                }
            }
        );
    }

    ngOnChanges(changes: SimpleChanges): void {}

    ngOnDestroy() {
        this.eventManager.destroy(this.dashboardPanelResizedSubscriber);
        this.unsubscribeToEventBus();
        this.stopAutoUpdateInterval();
    }

    ngAfterViewInit() {
        this.sidebarResetMenu();

        // sidebar height
        if (!this.embedded) {
            this.maxSidebarHeight = this.widgetHeight;
        } else {
            this.adjustWidgetHeightToEmbeddingIframeHeight();
        }
        // possible overflow handling
        this.tooltipOnOverflow();

        // attach listener to resize event
        const elementId = '#widget-viewport_' + this.widgetId;
        const element = $(elementId).get(0);
        elementResizeEvent(element, () => {
            // OPS ON WIDGET RESIZING
        });

        if (this.minimizedView) {
            // hide tabs
            (<any>$('.widget-viewport .tab-container ul')).css('display', 'none');
        }
    }

    ngAfterViewChecked() { }

    /**
     * Perspective
     */

    switchTab(justChosenTab: string) {
        if (justChosenTab === 'table') {
            this.tableTabActive = true;
            this.datasourceTabActive = false;
        } else if (justChosenTab === 'datasource') {
            this.tableTabActive = false;
            this.datasourceTabActive = true;
        }
    }

    /**
      * Theme limitless
      */

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

    /**
     * Data loading
     */

    loadElementsFromClasses(propagateNewDataset?: boolean) {

        const currentDatasetCardinality: number = this.lastLoadedData['elements'].length;
        if (this.appendLastResult && currentDatasetCardinality >= this.maxElementsByContract) {
            this.notificationService.push('warning', 'Dataset threshold reached', this.maxNumberOfElementsReachedAlert);
            return;
        } else {

            // updating last fetching mode
            this.lastFetchingMode = FetchingMode.LOAD_FROM_CLASS;

            const json = {
                classesNames: [this.classForDataFetching],
                limit: this.limitForNodeFetching,
                datasetCardinality: currentDatasetCardinality
            };
            const jsonContent = JSON.stringify(json);
            this.startSpinner();
            this.widgetService.loadElementsFromClasses(this.widgetId, jsonContent).subscribe((data: Object) => {
                this.stopSpinner();

                this.updateTableWidgetData(data);
                this.updateDatasourceMetadataFromData(data);
                this.updateFilteringMenu();

                const resultTruncated: boolean = data['elementsTruncated'];
                if (resultTruncated === true) {
                    const resultSize = data['maxElementsByQuery'];
                    const message: string = 'The result was truncated to ' + resultSize + ' elements.';
                    this.notificationService.push('warning', 'Query', message);
                }

                // propagating the new current dataset if requested
                if (propagateNewDataset && this.minimizedView) {
                    this.propagateDatasetMulticastChange();
                }
            }, (error: HttpErrorResponse) => {
                this.stopSpinner();
                this.handleError(error.error, 'Data loading');
            });
        }
    }

    loadDataFromCurrentQuery(propagateNewDataset?: boolean) {
        if (this.currentQuery) {
            this.loadDataFromQuery(this.currentQuery, propagateNewDataset);
        } else {
            this.notificationService.push('error', 'Query', 'Query not correctly specified. Please check the query again.');
        }
    }

    loadDataFromQuery(query: string, propagateNewDataset?: boolean) {

        // closing modal if any
        if (this.modalRef) {
            this.modalRef.hide();
        }

        const currentDatasetCardinality: number = this.lastLoadedData['elements'].length;
        if (this.appendLastResult && currentDatasetCardinality >= this.maxElementsByContract) {
            this.notificationService.push('warning', 'Dataset threshold reached', this.maxNumberOfElementsReachedAlert);
            return;
        } else {

            // updating last fetching mode
            this.lastFetchingMode = FetchingMode.QUERY;

            const json = {
                query: query,
                datasetCardinality: currentDatasetCardinality,
                skipIsolatedNodes: this.skipIsolatedNodes,
                skipEdgesNotInDataset: this.skipEdgesNotInDataset,
                includesNodesOfEdge: this.includesNodesOfEdge
            };
            const jsonContent = JSON.stringify(json);
            this.startSpinner();
            this.widgetService.loadDataFromQuery(this.widgetId, jsonContent).subscribe((data: Object) => {
                this.stopSpinner();

                this.updateTableWidgetData(data);
                this.updateDatasourceMetadataFromData(data);
                this.updateFilteringMenu();

                const resultTruncated: boolean = data['elementsTruncated'];
                if (resultTruncated === true) {
                    const resultSize = data['maxElementsByQuery'];
                    const message: string = 'The result was truncated to ' + resultSize + ' elements.';
                    this.notificationService.push('warning', 'Query', message);
                }

                // propagating the new current dataset if requested
                if (propagateNewDataset && this.minimizedView) {
                    this.propagateDatasetMulticastChange();
                }
            }, (error: HttpErrorResponse) => {
                this.stopSpinner();
                this.handleError(error.error, 'Data loading');
            });
        }
    }

    loadSnapshot() {
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
                this.startSpinner();
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
            this.updateTableWidgetFromSnapshot(snapshot);
            this.updateClassesNamesAccordingMetadata();
            if (!this.minimizedView) {
                this.updateFilteringMenu();
            }
            this.snapshotLoaded = true;
        }, 10);
    }

    updateTableWidgetFromSnapshot(snapshot) {

        this.newDatasetToPropagate = snapshot['newDatasetToPropagate'];

        if (this.newDatasetToPropagate && this.minimizedView) {
            this.propagateDatasetMulticastChangeFromSnapshot(snapshot);
            this.newDatasetToPropagate = false;
        }

        // Loading metadata
        this.dataSourceMetadata = snapshot['dataSourceMetadata'];
        if (snapshot['filters']) {
            this.filters = snapshot['filters'];
            if (this.filters.length > 0) {
                this.startingFilters = this.filters.slice();
            }
        }
        this.appendLastResult = snapshot['appendLastResult'];

        // Loading data
        if (snapshot['lastLoadedData']) {
            this.lastLoadedData = snapshot['lastLoadedData'];
        }
        if (snapshot['lastLoadedClasses']) {
            this.lastLoadedClasses = snapshot['lastLoadedClasses'];
        }
        if (snapshot['lastLoadedColumns']) {
            this.lastLoadedColumns = snapshot['lastLoadedColumns'];
        }
        if (!this.minimizedView && snapshot['perspective']) {
            this.tableTabActive = snapshot['perspective']['tableTabActive'];
            this.datasourceTabActive = snapshot['perspective']['datasourceTabActive'];
        }
        this.classNameColumnIncluded = snapshot['classNameColumnIncluded'];
        if (snapshot['currentQuery']) {
            this.currentQuery = snapshot['currentQuery'];
        }
        if (snapshot['classForDataFetching']) {
            this.classForDataFetching = snapshot['classForDataFetching'];
        }

        // Auto Update
        if (snapshot['autoUpdate'] !== undefined) {
            this.autoUpdate = snapshot['autoUpdate'];
        }
        if (snapshot['autoUpdateIntervalWindow']) {
            this.autoUpdateIntervalWindow = snapshot['autoUpdateIntervalWindow'];
        }
        this.lastFetchingMode = snapshot['lastFetchingMode'];
        if (this.autoUpdate) {
            this.startAutoUpdateInterval();
        }

        this.stopSpinner();
    }

    handleAppendLastResultChange() {
        // append-last-result flag cannot work with auto update, as they are mutual exclusive
        if (this.autoUpdate) {
            this.switchAutoUpdate();
        }
    }

    switchAutoUpdate() {
        this.autoUpdate = !this.autoUpdate;
        this.handleAutoUpdateFlagChange();
    }

    handleAutoUpdateFlagChange() {
        if (this.autoUpdate) {
            // trigger the timeout
            this.startAutoUpdateInterval();

            // auto-update cannot work with append-last-result flag, as they are mutual exclusive
            if (this.appendLastResult) {
                this.appendLastResult = false;
            }
        } else {
            // stop the timeout
            this.stopAutoUpdateInterval();
        }
    }

    startAutoUpdateInterval() {
        this.autoUpdateInterval = setInterval(() => {
            this.performLastDataFetching();
        }, this.autoUpdateIntervalWindow * 1000);
    }

    stopAutoUpdateInterval() {
        clearInterval(this.autoUpdateInterval);
    }

    handleAutoUpdateIntervalChange() {

        setTimeout(() => {
            if (!this.autoUpdateIntervalWindow || this.autoUpdateIntervalWindow < this.minimumTimeoutWindow) {
                this.autoUpdateIntervalWindow = this.minimumTimeoutWindow;
                $('#autoUpdateIntervalWindow').val(this.autoUpdateIntervalWindow);
            }

            if (this.autoUpdate) {
                // stop the old interval
                this.stopAutoUpdateInterval();

                // start a new interval according to the new current time window
                this.startAutoUpdateInterval();
            }
        }, 500);
    }

    performLastDataFetching() {

        const propagateNewDataset: boolean = true;
        switch (this.lastFetchingMode) {
            case FetchingMode.LOAD_FROM_CLASS:
                this.loadElementsFromClasses(propagateNewDataset);
                break;

            case FetchingMode.QUERY:
                this.loadDataFromCurrentQuery(propagateNewDataset);
                break;

            default:
                const message: string = `Cannot find the last fetching information to perform a new data polling. Auto Update will be disabled.\n
            Try to execute a first data fetching then enable the Auto Update again.`;
                this.notificationService.push('info', 'Auto Update', message);
                this.switchAutoUpdate();
                break;
        }
    }

    /**
     * Used to propagate a dataset change in multicast to all the secondary widgets. It's performed after the snapshot loading in the minimized view.
     * @param snapshot
     */
    propagateDatasetMulticastChangeFromSnapshot(snapshot: Object): void {
        const elements = snapshot['lastLoadedData']['elements'];
        const cleanedDatasourceMetadata = this.cleanDatasourceMetadataForSecondaryWidget(snapshot['dataSourceMetadata'], elements);
        const content: DatasetUpdatedMessageContent = this.buildDatasetMessageContent(elements, cleanedDatasourceMetadata);
        this.widgetEventBusService.publish(MessageType.DATASET_UPDATED_MESSAGE, new DatasetUpdatedMessage(content));
    }

    /**
     *  Used to propagate a dataset change in multicast to all the secondary widgets starting from the current widget dataset and metadata.
     */
    propagateDatasetMulticastChange() {
        if (this.lastLoadedData && this.lastLoadedData['elements'].length > 0 && this.dataSourceMetadata) {
            const elements = this.lastLoadedData['elements'];
            const cleanedDatasourceMetadata = this.cleanDatasourceMetadataForSecondaryWidget(this.dataSourceMetadata, elements);
            const content: DatasetUpdatedMessageContent = this.buildDatasetMessageContent(elements, cleanedDatasourceMetadata);
            this.widgetEventBusService.publish(MessageType.DATASET_UPDATED_MESSAGE, new DatasetUpdatedMessage(content));
        }
    }

    /**
     * Used to propagate dataset after a request from a specific secondary widget.
     */
    propagateDatasetTo(secondaryWidgetId: number) {
        const elements: Object[] = this.lastLoadedData['elements'];
        const cleanedDatasourceMetadata = this.cleanDatasourceMetadataForSecondaryWidget(this.dataSourceMetadata, elements);
        const content: DatasetUpdatedMessageContent = this.buildDatasetMessageContent(elements, cleanedDatasourceMetadata, secondaryWidgetId);
        this.widgetEventBusService.publish(MessageType.DATASET_UPDATED_MESSAGE, new DatasetUpdatedMessage(content));
    }

    buildDatasetMessageContent(elements: Object[], dataSourceMetadata: Object, secondaryWidgetId?: number): DatasetUpdatedMessageContent {
        const content: DatasetUpdatedMessageContent = {
            primaryWidgetId: this.widget.id,
            secondaryWidgetId: secondaryWidgetId,
            data: elements,
            metadata: dataSourceMetadata
        };
        return content;
    }

    cleanDatasourceMetadataForSecondaryWidget(dataSourceMetadata: Object, elements: Object[]): Object {
        return super.cleanDatasourceMetadataForSecondaryWidget(dataSourceMetadata, elements);
    }

    /**
     * It adds data elements (single vertices and edges)
     * to the instance variables if not present yet.
     * @param data
     */
    updateTableWidgetData(data) {

        /*
         * Elements
         */

        // saving class name inside data object and setting 'selectable' with the default value (true)
        data['nodes'].forEach((elem) => {
            elem['data']['class'] = elem['classes'];
            elem['selectable'] = true; // whether the selection state is mutable (default true)

        });
        data['edges'].forEach((elem) => {
            elem['data']['class'] = elem['classes'];
            // pushing down some edge info into the record level
            elem['data']['record']['edgeId'] = elem['data']['id'];
            elem['data']['record']['source'] = elem['data']['source'];
            elem['data']['record']['target'] = elem['data']['target'];
            elem['selectable'] = true; // whether the selection state is mutable (default true)
        });

        if (data['nodes'].length > 0 && data['edges'].length > 0) {
            if (this.appendLastResult) {
                this.lastLoadedData['elements'] = this.lastLoadedData['elements'].concat(data['nodes']).concat(data['edges']);
            } else {
                this.lastLoadedData['elements'] = data['nodes'].concat(data['edges']);
            }
        } else if (data['nodes'].length > 0 && data['edges'].length === 0) {
            if (data['nodes'].length > 0) {
                if (this.appendLastResult) {
                    this.lastLoadedData['elements'] = this.lastLoadedData['elements'].concat(data['nodes']);
                } else {
                    this.lastLoadedData['elements'] = data['nodes'];
                }
            }
        } else if (data['nodes'] === 0 && data['edges'].length > 0) {
            if (this.appendLastResult) {
                this.lastLoadedData['elements'] = this.lastLoadedData['elements'].concat(data['edges']);
            } else {
                this.lastLoadedData['elements'] = data['edges'];
            }
        }

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;
    }

    /**
     * It updates datasource metadata starting from the data retrieved through:
     * - nodes loading by ids
     * - nodes fetching per class
     */
    updateDatasourceMetadataFromData(data) {

        // updating node class properties with the new entering nodes just loaded
        for (const nodeClassName of Object.keys(data['nodesClasses'])) {
            const currNodeClassMetadata = data['nodesClasses'][nodeClassName];

            if (!this.dataSourceMetadata['nodesClasses'][nodeClassName]) {
                // add the new entering node class

                if (!currNodeClassMetadata['name']) {
                    currNodeClassMetadata['name'] = nodeClassName;
                }
                if (!currNodeClassMetadata['cardinality']) {
                    currNodeClassMetadata['cardinality'] = 0;
                }
                if (!currNodeClassMetadata['properties']) {
                    currNodeClassMetadata['properties'] = {};
                }
                this.addNodeClassMetadata(nodeClassName, currNodeClassMetadata);
            } else {
                // adding just new entering properties with included flag set to true
                for (const currPropertyName of Object.keys(currNodeClassMetadata)) {
                    if (!this.dataSourceMetadata['nodesClasses'][nodeClassName]['properties'][currPropertyName]) {
                        const newEnteringPropertyMetadata = {
                            name: currPropertyName,
                            type: currNodeClassMetadata[currPropertyName],
                            included: true
                        };
                        this.dataSourceMetadata['nodesClasses'][nodeClassName]['properties'][currPropertyName] = newEnteringPropertyMetadata;
                    }
                }

                // removing the properties no more contained in the new metadata version
                for (const currPropertyName of Object.keys(this.dataSourceMetadata['nodesClasses'][nodeClassName]['properties'])) {
                    if (!data['nodesClasses'][nodeClassName][currPropertyName]) {
                        delete this.dataSourceMetadata['nodesClasses'][nodeClassName]['properties'][currPropertyName];
                    }
                }
            }
        }

        // updating edge class properties with the new entering edges just loaded
        for (const edgeClassName of Object.keys(data['edgesClasses'])) {
            const currEdgeClassMetadata = data['edgesClasses'][edgeClassName];

            if (!this.dataSourceMetadata['edgesClasses'][edgeClassName]) {
                // add the new entering edge class

                if (!currEdgeClassMetadata['name']) {
                    currEdgeClassMetadata['name'] = edgeClassName;
                }
                if (!currEdgeClassMetadata['cardinality']) {
                    currEdgeClassMetadata['cardinality'] = 0;
                }
                if (!currEdgeClassMetadata['properties']) {
                    currEdgeClassMetadata['properties'] = {};
                }
                this.addEdgeClassMetadata(edgeClassName, currEdgeClassMetadata);
            } else {

                // adding just new entering properties with included flag set to true
                for (const currPropertyName of Object.keys(currEdgeClassMetadata)) {
                    if (!this.dataSourceMetadata['edgesClasses'][edgeClassName]['properties'][currPropertyName]) {
                        const newEnteringPropertyMetadata = {
                            name: currPropertyName,
                            type: currEdgeClassMetadata[currPropertyName],
                            included: true
                        };
                        this.dataSourceMetadata['edgesClasses'][edgeClassName]['properties'][currPropertyName] = newEnteringPropertyMetadata;
                    }
                }

                // removing the properties no more contained in the new metadata version
                for (const currPropertyName of Object.keys(this.dataSourceMetadata['edgesClasses'][edgeClassName]['properties'])) {
                    if (!data['edgesClasses'][edgeClassName][currPropertyName]) {
                        delete this.dataSourceMetadata['edgesClasses'][edgeClassName]['properties'][currPropertyName];
                    }
                }
            }
        }

        // last loaded columns updating
        this.updateLoadedColumns();
    }

    addNodeClassMetadata(nodeClassName: string, metadata: Object) {
        this.dataSourceMetadata['nodesClasses'][nodeClassName] = metadata;
    }

    addEdgeClassMetadata(edgeClassName: string, metadata: Object) {
        this.dataSourceMetadata['edgesClasses'][edgeClassName] = metadata;
    }

    closePopover() {
        if (this.popoverMustBeOpen) {
            this.popoverMustBeOpen = false;
        }
    }

    getEmptyWidgetMessageHeight() {
        const widgetHeight: number = parseInt(this.widgetHeight.replace('px', ''), 10);
        const top: string = widgetHeight / 3 + 'px';
        return top;
    }

    /**
     * Event bus methods
     */

    onSubsetSelection(message: SubsetSelectionChangeMessageContent) {

        let finalElements: Object[] = [];
        for (const curreFilteringRule of message.class2property) {
            const currClassName = curreFilteringRule['className'];
            const classElements = this.getElementsOfClass(currClassName);
            for (const currPropertyValue of message.propertyValues) {
                const currFilteredElements = classElements.filter((element) => {
                    const currElemData = element['data']['record'];
                    const currPropertyname = curreFilteringRule['property'];
                    // tslint:disable-next-line:triple-equals
                    if (currElemData[currPropertyname] == currPropertyValue) {
                        return true;
                    }
                    return false;
                });
                finalElements = finalElements.concat(currFilteredElements);
            }
        }

        // cleaning previous selection
        this.unselectAll();

        if (finalElements.length > 0) {
            this.selectElements(finalElements);
        }
        this.callTableSelectionSort();

        if (this.principal.hasAnyAuthorityDirect(['ROLE_ADMIN', 'ROLE_EDITOR'])) {
            this.saveAll(true);
        }
    }

    /**
     * It performs all the operations that must be performed after the indexing process completion.
     */
    performOperationsAfterIndexingComplete() {

        // filter menu update
        if (this.lastLoadedData['elements'].length > 0) {
            this.updateFilteringMenu();
        }
    }

    /**
     * Used by full text search, as an api is still missing.
     * @param query
     */
    loadNodesFromIds(nodeIds: string[], propagateNewDataset?: boolean) {

        const currentDatasetCardinality: number = this.lastLoadedData['elements'].length;
        if (this.appendLastResult && currentDatasetCardinality >= this.maxElementsByContract) {
            this.notificationService.push('warning', 'Dataset threshold reached', this.maxNumberOfElementsReachedAlert);
            return;
        } else {
            const jsonParams = {
                ids: nodeIds,
                datasetCardinality: currentDatasetCardinality
            };
            const jsonContent = JSON.stringify(jsonParams);
            this.startSpinner();
            this.widgetService.loadNodesFromIds(this.widgetId, jsonContent).subscribe((data: Object) => {
                this.stopSpinner();
                this.updateTableWidgetData(data);
                this.updateDatasourceMetadataFromData(data);
                this.resetFullTextSearch();
                this.updateFilteringMenu();

                // propagating the new current dataset if requested
                if (propagateNewDataset && this.minimizedView) {
                    this.propagateDatasetMulticastChange();
                }
            }, (error: HttpErrorResponse) => {
                this.stopSpinner();
                this.handleError(error.error, 'Data loading');
            });
        }
    }

    /**
      * Filterings
      */

    updateFilteringMenu() {
        const currentGraphNodesIds: string[] = [];
        this.lastLoadedData['elements'].forEach((element) => {
            currentGraphNodesIds.push(element['data']['id']);
        });
        if (this.dataSource && this.dataSource['indexing'] &&
            this.dataSource['indexing'].toString() === 'INDEXED') {
            if (this.filterMenu) {
                // filter menu already initialised
                this.filterMenu.updateFilteringMenu(currentGraphNodesIds, true);
            } else {
                // waiting for filter menu initialisation
                setTimeout(() => {
                    this.updateFilteringMenu();
                }, 500);
            }
        }
    }

    filterResetAll() {

        this.filterMenu.filterResetAll();
        this.filters = [];
        this.unselectAll();
    }

    upgradeFilters(event) {
        const incomingFilter = event;
        let switched: boolean = false;
        let index = 0;
        for (const currentFilter of this.filters) {
            if (currentFilter['className'] === incomingFilter['className'] &&
                currentFilter['field'] === incomingFilter['field']) {
                if (incomingFilter['values'].length > 0) {
                    // switch the old filter with the new one, as it has the 'values' field updated
                    this.filters.splice(index, 1, incomingFilter);
                } else {
                    // delete the filter
                    this.filters.splice(index, 1);
                }
                switched = true;
                break;
            }
            index++;
        }
        if (!switched) {
            this.filters.push(incomingFilter);
        }
    }

    filterResults(newFilteringEvent?) {

        // updating filters according to the user form updating
        if (newFilteringEvent) {
            this.upgradeFilters(newFilteringEvent);
        }

        if (this.filters.length === 0) {
            this.unselectAll();
            return;
        }

        let totalElementsFilteredin = undefined;
        for (const currentFilter of this.filters) {

            const elementsOfClass = this.getElementsOfClass(currentFilter['className']);
            const elementsFilteredIn = elementsOfClass.filter((ele) => {

                const record = ele['data']['record'];
                const recordValue = record[currentFilter['field']];
                if (!recordValue) {
                    return false;
                } else {
                    for (const valueIdx of Object.keys(currentFilter['values'])) {
                        const stringifiedRecordValue = recordValue.toString();
                        if (currentFilter['values'][valueIdx] === stringifiedRecordValue) {
                            return true;
                        }
                    }
                }
                return false;
            });

            this.selectElements(elementsFilteredIn);
            if (totalElementsFilteredin !== undefined) {
                totalElementsFilteredin = totalElementsFilteredin.concat(elementsFilteredIn);
            } else {
                totalElementsFilteredin = elementsFilteredIn;
            }
        }
        const totalElementsFilteredOut = this.lastLoadedData['elements'].filter((elem) => {
            return !totalElementsFilteredin.includes(elem);
        });
        this.unselectElements(totalElementsFilteredOut);

        this.callTableSelectionSort();
    }

    hideElements(elements, removeSelection: boolean) {

        for (const element of elements) {
            element['data']['hidden'] = true;
            if (removeSelection) {
                elements['selected'] = false;
            }
        }
        this.updateLoadedElements();

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;
    }

    /*
     * Shows all the elements according to the elements collection passed as param.
     * It calls the auxiliary method with the showConnectedEdges set true.
    */
    showElements(elements) {
        for (const element of elements) {
            element['data']['hidden'] = false;
        }
        this.updateLoadedElements();

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;
    }

    /**
     * Table Columns selection/unselction
     */

    selectAllPropertiesOfClass(className: string, classType: string) {
        if (classType === 'node') {
            this.updateSelectionFlagForPropertiesOfNodeClass(className, true);
        } else if (classType === 'edge') {
            this.updateSelectionFlagForPropertiesOfEdgeClass(className, true);
        }
        this.updateLoadedColumns();
    }

    unselectAllPropertiesOfClass(className: string, classType: string) {
        if (classType === 'node') {
            this.updateSelectionFlagForPropertiesOfNodeClass(className, false);
        } else if (classType === 'edge') {
            this.updateSelectionFlagForPropertiesOfEdgeClass(className, false);
        }
        this.updateLoadedColumns();
    }

    updateSelectionFlagForPropertiesOfNodeClass(className, value) {
        for (const propertyName of Object.keys(this.dataSourceMetadata['nodesClasses'][className]['properties'])) {
            this.dataSourceMetadata['nodesClasses'][className]['properties'][propertyName]['included'] = value;
        }
    }

    updateSelectionFlagForPropertiesOfEdgeClass(className, value) {
        for (const propertyName of Object.keys(this.dataSourceMetadata['edgesClasses'][className]['properties'])) {
            this.dataSourceMetadata['edgesClasses'][className]['properties'][propertyName]['included'] = value;
        }
    }

    /**
     * Selections
     */

    getElementsOfClass(className: string, type?: string): string[] {
        const elements: string[] = [];
        let groupType: string;
        if (type) {
            if (type === 'node') {
                groupType = 'nodes';
            } else {
                groupType = 'edges';
            }
        }

        if (groupType) {
            for (const element of this.lastLoadedData['elements']) {
                if (element['group'] === groupType && element['classes'] === className) {
                    elements.push(element);
                }
            }
        } else {
            for (const element of this.lastLoadedData['elements']) {
                if (element['classes'] === className) {
                    elements.push(element);
                }
            }
        }
        return elements;
    }

    selectElementsOfClass(type: string, className: string) {
        let groupType: string;
        if (type === 'node') {
            groupType = 'nodes';
        } else {
            groupType = 'edges';
        }
        for (const element of this.lastLoadedData['elements']) {
            if (element['group'] === groupType && element['classes'] === 'classes') {
                element['selected'] = true;
            }
        }
    }

    selectAll() {
        this.selectElements(this.lastLoadedData['elements']);
    }

    unselectAll() {
        this.unselectElements(this.lastLoadedData['elements']);
    }

    selectElements(elements: Object[]) {
        for (const element of elements) {
            if (!element['selected']) {
                element['selected'] = true;
            }
        }
    }

    unselectElements(elements: Object[]) {
        for (const element of elements) {
            if (element['selected']) {
                element['selected'] = false;
            }
        }
    }

    selectInverted() {
        for (const element of this.lastLoadedData['elements']) {
            if (element['selected']) {
                element['selected'] = false;
            } else {
                element['selected'] = true;
            }
        }
    }

    /**
     * Editing
     */

    deleteSelected() {
        let deletedElements: string[] = [];
        let i = 0;
        while (i < this.lastLoadedData['elements'].length) {
            const element = this.lastLoadedData['elements'][i];
            if (element['selected']) {
                deletedElements = deletedElements.concat(this.lastLoadedData['elements'].splice(i, 1));
            } else {
                i++;
            }
        }

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;

        const messageTitle = 'Deleted elements';
        const message = 'Deleted ' + deletedElements.length + ' elements';
        this.notificationService.push('success', messageTitle, message);

        // updating table input elements and columns
        this.updateLoadedElements();
        this.updateLoadedColumns();

        return deletedElements;
    }

    deleteNotSelected() {
        let deletedElements: string[] = [];
        let i = 0;
        while (i < this.lastLoadedData['elements'].length) {
            const element = this.lastLoadedData['elements'][i];
            if (!element['selected']) {
                deletedElements = deletedElements.concat(this.lastLoadedData['elements'].splice(i, 1));
            } else {
                i++;
            }
        }

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;

        const messageTitle = 'Deleted elements';
        const message = 'Deleted ' + deletedElements.length + ' elements';
        this.notificationService.push('success', messageTitle, message);

        // updating table input elements and columns
        this.updateLoadedElements();
        this.updateLoadedColumns();

        return deletedElements;
    }

    crop() {
        const deletedElements: string[] = this.deleteNotSelected();
        const numberOfDeletedElements: number = deletedElements.length;
    }

    deleteElementById(elementId: string) {
        let i = 0;
        for (const element of this.lastLoadedData['elements']) {
            if (element['data']['id'] === elementId) {
                this.lastLoadedData['elements'].splice(i, 1);
                break;
            }
            i++;
        }

        // updating table input elements and columns
        this.updateLoadedElements();
        this.updateLoadedColumns();
    }

    /**
     * It's called to update the input elements for the table component when occurs:
     * - elements selection/unselection
     * - elements showing/hiding
     * - elements adding in the current dataset
     * - elements removing from the current dataset
     *
     * All the elements will be included, then the set is ordere according to selection order.
     */
    updateLoadedElements() {
        this.lastLoadedData['elements'] = [...this.lastLoadedData['elements']]; // just to make the update visible to the table child component
    }

    /**
     * It's called to update the input columns for the table component when occurs:
     * - elements adding in the current dataset
     * - elements removing from the current dataset
     * - column 'included' flag changing
     *
     * Will be included all the columns for each class having at least an element in the current dataset
     * and 'included' flag set to true.
     */
    updateLoadedColumns() {

        this.lastLoadedColumns = [];
        this.lastLoadedClasses = this.getAllClassNamesWithElementsInCurrentDataset();
        let edgeClassesPresent: boolean = false;
        for (const className of this.lastLoadedClasses) {
            let properties;
            if (this.dataSourceMetadata['nodesClasses'][className]) {
                properties = this.dataSourceMetadata['nodesClasses'][className]['properties'];
            } else if (this.dataSourceMetadata['edgesClasses'][className]) {
                properties = this.dataSourceMetadata['edgesClasses'][className]['properties'];
                edgeClassesPresent = true;
            }
            if (properties !== undefined) {
                for (const propertyName of Object.keys(properties)) {
                    if (properties[propertyName]['included']) {
                        const currProperty = properties[propertyName];
                        const currPropertyInfo = {
                            name: propertyName,
                            type: currProperty['type'],
                            sortingStatus: SortingStatus.NOT_SORTED
                        };
                        this.lastLoadedColumns.push(currPropertyInfo);
                    }
                }
            }
        }

        if (edgeClassesPresent) {
            // adding fixed columns for edges: id, source and target
            this.lastLoadedColumns.push({
                name: 'edgeId',
                type: 'string',
                sortingStatus: SortingStatus.NOT_SORTED
            });
            this.lastLoadedColumns.push({
                name: 'source',
                type: 'string',
                sortingStatus: SortingStatus.NOT_SORTED
            });
            this.lastLoadedColumns.push({
                name: 'target',
                type: 'string',
                sortingStatus: SortingStatus.NOT_SORTED
            });
        }
    }

    getAllClassNamesWithElementsInCurrentDataset(): string[] {
        const classNames = new Set();
        this.lastLoadedData['elements'].forEach((elem) => {
            classNames.add(elem['data']['class']);
        });
        return Array.from(classNames);
    }

    callTableSelectionSort() {
        if (this.tableComponent) {
            this.tableComponent.sortInputElementsBySelectionColumn('asc');
        } else {
            setTimeout(() => {
                if (this.tableComponent) {
                    this.tableComponent.sortInputElementsBySelectionColumn('asc');
                } else {
                    this.callTableSelectionSort();
                }
            }, 50);
        }
    }

    /*
     * Save/export functions, snapshot loading
     */

    // saves both data and metadata
    saveAll(hideNotification?: boolean) {

        let infoNotification;
        if (!hideNotification) {
            infoNotification = this.notificationService.push('info', 'Save', 'Saving the widget...', 3000, 'fa fa-spinner fa-spin');
        }
        const delay: number = 10;

        setTimeout(() => {      // just to avoid the saving ops block the first notification message
            const json = {
                lastLoadedData: this.lastLoadedData,
                lastLoadedClasses: this.lastLoadedClasses,
                lastLoadedColumns: this.lastLoadedColumns,
                dataSourceMetadata: this.dataSourceMetadata,
                filters: this.filters,
                newDatasetToPropagate: this.newDatasetToPropagate,
                appendLastResult: this.appendLastResult,
                classNameColumnIncluded: this.classNameColumnIncluded,
                currentQuery: this.currentQuery,
                classForDataFetching: this.classForDataFetching,
                autoUpdate: this.autoUpdate,
                autoUpdateIntervalWindow: this.autoUpdateIntervalWindow,
                lastFetchingMode: this.lastFetchingMode
            };

            const perspective: Object = {
                tableTabActive: this.tableTabActive,
                datasourceTabActive: this.datasourceTabActive,
            };
            json['perspective'] = perspective;

            const jsonContent = JSON.stringify(json);

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
        }, delay);
    }

    exportAsCSV() {
        const csv: string = this.tableComponent.getTableAsCSV();
        const blob = new Blob([csv], { type: 'text/plain;charset=utf-8'});
        const exportType = 'csv';
        const fileName = this.fileName + '.' + exportType;
        fileSaver.saveAs(blob, fileName);
    }
}
