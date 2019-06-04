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
    ChangeDetectorRef, ViewChild, ViewChildren, QueryList
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { PrimaryWidget } from '../../primary-widget';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';
import * as $ from 'jquery';
import { Subscription } from 'rxjs';
import { JhiEventManager } from 'ng-jhipster';
import { DataWidgetComponent, FetchingMode } from '../datawidget.component';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { DatasetUpdatedMessage, DatasetUpdatedMessageContent, SnapshotMenuComponent, TableComponent, SortingStatus } from '../../..';
import { SubsetSelectionChangeMessageContent, MessageType } from '../../../event-message';
import { DataSource } from 'app/entities/data-source';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { QueryParameterComponent } from './query-parameter.component';

const elementResizeEvent = require('element-resize-event');

/**
 * This component allows users to build and save query templates, to run stated query and inspect
 * the actual resulset through a table perspective.
 */
@Component({
    selector: 'query-widget',
    templateUrl: './querywidget.component.html',
    styleUrls: ['./querywidget.component.scss']
})
export class QueryWidgetComponent extends DataWidgetComponent implements PrimaryWidget, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges {

    subsetSelectionSubscription: Subscription;
    datasetPropagationRequestSubscription: Subscription;

    maxSidebarHeight: string;

    loadingGraphElements = [];     // used to store new graph elements retrieved with the last query/snapshot
    loadingGraphElementsPositions = {};     // used to store new graph elements retrieved with the last snapshot

    // fetching mode
    appendLastResult: boolean = false;

    // querying
    queryLanguageSelection: string = 'OrientDB SQL';
    supportedQueryLanguages: string[] = ['OrientDB SQL', 'SQL (RDBMS)'];
    lastLoadedData: Object;
    modalRef: BsModalRef;
    currentQuery: string = '';
    skipIsolatedNodes: boolean = false;
    skipEdgesNotInDataset: boolean = false;
    includesNodesOfEdge: boolean = false;
    parametersName2Info: Object = {};

    // Parameters components
    @ViewChildren(QueryParameterComponent) parameterComponents: QueryList<QueryParameterComponent>;

    // auto update
    autoUpdate: boolean = false;
    minimumTimeoutWindow: number;
    autoUpdateIntervalWindow: number;
    autoUpdateInterval;  // timer used to trigger the new data fetching once the time window has completed
    autoUpdatePopover: string = `Use this flag to refresh data according to the last query.<br/>
                                You can state the time interval by specifying the desired number of seconds in the form below.<br/>
                                Append-last-result and auto-update flags cannot be both enabled.`;
    autoSwitchTabPopover: string = `Use this flag to automatically switch to the table perspective after query execution
                                in order to inspect the result.<br/>`;

    // flag stating if the current dataset must be propagated to potential secondary widgets
    newDatasetToPropagate: boolean = false;

    // table data
    @ViewChild('tableComponent') tableComponent: TableComponent;
    lastLoadedColumns: Object[] = [];
    deletionEnabled: boolean = false;
    selectionEnabled: boolean = false;
    classNameColumnIncluded: boolean = false;

    // snapshot menu
    @ViewChild('snapshotMenu') snapshotMenu: SnapshotMenuComponent;

    // perspective
    queryTabActive: boolean = true;
    tableTabActive: boolean = false;
    datasourceTabActive: boolean = false;
    autoSwitchTabAfterQuery: boolean = false;

    public outerAccordion: string = 'outer-accordion';
    public innerAccordion: string = 'inner-accordion';

    // rows height
    queryLanguageRowHeight: string;
    queryRowHeight: string;
    paramsTitleHeight: string;
    parametersRowHeight: string;

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

        this.dataSourceMetadata = {
            nodesClasses: {
                Table: {}
            }
        };

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

    registerChangeInDashboards() {
        this.dashboardPanelResizedSubscriber = this.eventManager.subscribe(
            'dashboardPanelResized',
            (response) => {
                if (response.content === this.widgetId) {
                    console.log('Query widget #' + this.widgetId + ' detected resize in minimized view.');
                }
            }
        );
    }

    ngOnChanges(changes: SimpleChanges): void { }

    ngOnDestroy() {
        this.eventManager.destroy(this.dashboardPanelResizedSubscriber);
        this.unsubscribeToEventBus();
        this.stopAutoUpdateInterval();
    }

    ngAfterViewInit() {
        this.sidebarResetMenu();

        // initialising rows heights according to the view mode
        this.updateViewportHeightsAccordingToWidgetHeight();

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
            this.updateViewportHeightsAccordingToWidgetHeight();
        });

        if (this.minimizedView) {
            // hide tabs
            (<any>$('.widget-viewport .tab-container ul')).css('display', 'none');
        }
    }

    ngAfterViewChecked() { }

    updateViewportHeightsAccordingToWidgetHeight() {
        this.queryRowHeight = '25%';
        if (this.minimizedView) {
            this.queryLanguageRowHeight = '0px';
            this.paramsTitleHeight = '0px';

            this.parametersRowHeight = parseInt(this.widgetHeight.replace('px', ''), 10)
                - parseInt(this.queryLanguageRowHeight.replace('px', ''), 10)
                - parseInt(this.paramsTitleHeight.replace('px', ''), 10) + 'px';
        } else {
            this.queryLanguageRowHeight = '18%';
            this.paramsTitleHeight = '8%';
            this.parametersRowHeight = '49%';
        }
    }

    /**
     * It updated parameters list according to the current query
     */

    handleQueryChange(event?) {

        if (this.currentQuery.indexOf(':') < 0 && Object.keys(this.parametersName2Info).length > 0) {
            this.parametersName2Info = {};
        }

        if (this.currentQuery.indexOf(':') >= 0) {
            const queryWords = this.currentQuery.split(/\s+/)
                .filter((word) => {
                    if (word.indexOf(':') >= 0) {
                        return true;
                    }
                    return false;
                }).map((word) => {
                    return word.replace(':', '');
                });

            // removing no more present parameters
            for (const paramName of Object.keys(this.parametersName2Info)) {
                if (queryWords.indexOf(paramName) < 0) {
                    delete this.parametersName2Info[paramName];
                }
            }

            // adding new params if not already present
            queryWords.forEach((queryWord) => {
                if (!this.parametersName2Info[queryWord]) {
                    this.parametersName2Info[queryWord] = {
                        value: undefined,
                        type: undefined,
                        domain: {
                            set: []
                        }
                    };
                }
            });

        }
    }

    /**
     * Perspective
     */

    switchTab(justChosenTab: string) {
        if (justChosenTab === 'query') {
            this.queryTabActive = true;
            this.tableTabActive = false;
            this.datasourceTabActive = false;
        } else if (justChosenTab === 'table') {
            this.queryTabActive = false;
            this.tableTabActive = true;
            this.datasourceTabActive = false;
        } else if (justChosenTab === 'datasource') {
            this.queryTabActive = false;
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
     * Data loading
     */

    clearQuery() {
        this.currentQuery = '';
    }

    loadElementsFromClasses(propagateNewDataset?: boolean) {
        // DO NOTHING FOR NOW
    }

    loadNodesFromIds(nodeIds: string[], propagateNewDataset?: boolean) {
        // DO NOTHING FOR NOW
    }

    loadDataFromQuery(query: string, propagateNewDataset?: boolean) {
        // DO NOTHING FOR NOW
    }

    loadDataFromCurrentQuery(propagateNewDataset?: boolean) {
        if (this.currentQuery) {

            let canExecuteQuery: boolean = true;
            let parametricQuery: boolean = true;
            // if there are parameters we have to check their validity
            if (this.parameterComponents.length > 0) {
                for (const currParameter of this.parameterComponents.toArray()) {
                    if (!currParameter.isValid()) {
                        canExecuteQuery = false;
                        parametricQuery = false;
                        const message = '\'' + currParameter['name'] +
                        '\' parameter is not well defined. Cannot perform the query, please check the parameter definition and try again.';
                        this.notificationService.push('warning', 'Wrong Parameter definition', message);
                        break;
                    }
                }
            } else {
                parametricQuery = false;
            }

            if (canExecuteQuery) {
                this.loadTableData(this.currentQuery, propagateNewDataset, parametricQuery);
            }
        } else {
            this.notificationService.push('error', 'Query', 'Query not correctly specified. Please check the query again.');
        }
    }

    loadTableData(query: string, propagateNewDataset: boolean, parametricQuery: boolean) {

        const queryParams: Object[] = [];
        if (parametricQuery) {
            for (const parameterName of Object.keys(this.parametersName2Info)) {
                queryParams.push({
                    name: parameterName,
                    type: this.parametersName2Info[parameterName]['type'],
                    value: this.parametersName2Info[parameterName]['value'],
                });
            }
        }

        const json = {
            query: query,
            datasetCardinality: 0,
            params: queryParams
        };

        const jsonContent = JSON.stringify(json);
        this.startSpinner();
        this.widgetService.loadTabledata(this.widget['id'], jsonContent).subscribe((data) => {
            this.stopSpinner();

            // update dataset and metadata
            this.updateQueryWidgetData(data);
            this.updateQueryMetadataFromData(data);

            if (!this.minimizedView && this.autoSwitchTabAfterQuery) {
                this.switchTab('table');
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
            this.updateQueryWidgetFromSnapshot(snapshot);
            this.snapshotLoaded = true;
        }, 10);
    }

    updateQueryWidgetFromSnapshot(snapshot) {

        this.newDatasetToPropagate = snapshot['newDatasetToPropagate'];

        if (this.newDatasetToPropagate && this.minimizedView) {
            this.propagateDatasetMulticastChangeFromSnapshot(snapshot);
            this.newDatasetToPropagate = false;
        }

        if (snapshot['queryLanguageSelection']) {
            this.queryLanguageSelection = snapshot['queryLanguageSelection'];
        }

        // Loading metadata
        this.dataSourceMetadata = snapshot['dataSourceMetadata'];
        this.appendLastResult = snapshot['appendLastResult'];

        // Loading data
        if (snapshot['lastLoadedData']) {
            this.lastLoadedData = snapshot['lastLoadedData'];
        }
        if (snapshot['lastLoadedColumns']) {
            this.lastLoadedColumns = snapshot['lastLoadedColumns'];
        }
        if (!this.minimizedView && snapshot['perspective']) {
            this.queryTabActive = snapshot['perspective']['queryTabActive'];
            this.tableTabActive = snapshot['perspective']['tableTabActive'];
            this.datasourceTabActive = snapshot['perspective']['datasourceTabActive'];
        }
        if (snapshot['currentQuery']) {
            this.currentQuery = snapshot['currentQuery'];
        }
        if (snapshot['parametersName2Info']) {
            this.parametersName2Info = snapshot['parametersName2Info'];
        }

        // Auto Update
        if (snapshot['autoUpdate'] !== undefined) {
            this.autoUpdate = snapshot['autoUpdate'];
        }
        if (snapshot['autoUpdateIntervalWindow']) {
            this.autoUpdateIntervalWindow = snapshot['autoUpdateIntervalWindow'];
        }
        if (this.autoUpdate) {
            this.startAutoUpdateInterval();
        }

        // auto switch to table tab after query
        if (snapshot['autoSwitchTabAfterQuery']) {
            this.autoSwitchTabAfterQuery = snapshot['autoSwitchTabAfterQuery'];
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
        this.loadDataFromCurrentQuery(propagateNewDataset);
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

    getEmptyWidgetMessageHeight() {
        const widgetHeight: number = parseInt(this.widgetHeight.replace('px', ''), 10);
        const top: string = widgetHeight / 3 + 'px';
        return top;
    }

    /**
     * It adds data elements (single vertices and edges)
     * to the instance variables if not present yet.
     * @param data
     */
    updateQueryWidgetData(data) {

        /*
         * Elements
         */

        // saving class name inside data object and setting 'selectable' with the default value (true)
        data['nodes'].forEach((elem) => {
            elem['data']['class'] = elem['classes'];
            elem['selectable'] = true; // whether the selection state is mutable (default true)

        });

        if (this.appendLastResult) {
            this.lastLoadedData['elements'] = this.lastLoadedData['elements'].concat(data['nodes']).concat(data['edges']);
        } else {
            this.lastLoadedData['elements'] = data['nodes'].concat(data['edges']);
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
    updateQueryMetadataFromData(data) {

        // updating node class properties with the new entering nodes just loaded
        const tableClassMetadata = data['nodesClasses']['Table']['properties'];

        if (!this.appendLastResult) {
            // clearing the last prop info
            this.dataSourceMetadata['nodesClasses']['Table']['properties'] = {};
            this.dataSourceMetadata['nodesClasses']['Table']['cardinality'] = 0;
        }
        for (const currProperty of Object.keys(tableClassMetadata)) {
            const newEnteringPropertyMetadata = {
                name: currProperty,
                type: tableClassMetadata[currProperty]
            };
            this.dataSourceMetadata['nodesClasses']['Table']['properties'][currProperty] = newEnteringPropertyMetadata;
        }

        // cardinality updating
        this.dataSourceMetadata['nodesClasses']['Table']['cardinality'] += data['nodesClasses']['Table']['cardinality'];

        // last classes and columns updating
        if (!this.appendLastResult) {
            this.lastLoadedColumns = [];
        }
        if (data['nodesClasses'] && data['nodesClasses']['Table']['properties']) {
            const newTableColumns: Object[] = [];
            const properties = Object.keys(data['nodesClasses']['Table']['properties']);
            for (const propertyName of properties) {
                const currProperty = data['nodesClasses']['Table']['properties'][propertyName];
                const currPropertyInfo = {
                    className: 'Table',
                    name: propertyName,
                    type: currProperty['type'],
                    included: true,
                    sortingStatus: SortingStatus.NOT_SORTED
                };
                newTableColumns.push(currPropertyInfo);
            }
            const finalColumns = new Set(this.lastLoadedColumns.concat(newTableColumns));
            this.lastLoadedColumns = Array.from(finalColumns);
        }
    }

    /**
     * Event bus methods
     */

    onSubsetSelection(message: SubsetSelectionChangeMessageContent) {
        // DO NOTHING FOR NOW
    }

    /**
     * It performs all the operations that must be performed after the indexing process completion.
     */
    performOperationsAfterIndexingComplete() {

        // faceting update
        this.updateParametersFacetings();
    }

    updateParametersFacetings() {
        // TODO
    }

    /**
     * It's called to update the input elements for the table component when occurs:
     * - elements selection/unselection
     * - elements showing/hiding
     * - elements adding in the current dataset
     * - elements removing from the current dataset
     * All the elements will be included, then the set is ordere according to selection order.
     */
    updateLoadedElements() {
        this.lastLoadedData['elements'] = [...this.lastLoadedData['elements']]; // just to make the update visible to the table child component
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
                queryLanguageSelection: this.queryLanguageSelection,
                lastLoadedData: this.lastLoadedData,
                lastLoadedColumns: this.lastLoadedColumns,
                dataSourceMetadata: this.dataSourceMetadata,
                newDatasetToPropagate: this.newDatasetToPropagate,
                appendLastResult: this.appendLastResult,
                currentQuery: this.currentQuery,
                parametersName2Info: this.parametersName2Info,
                autoUpdate: this.autoUpdate,
                autoUpdateIntervalWindow: this.autoUpdateIntervalWindow,
                autoSwitchTabAfterQuery: this.autoSwitchTabAfterQuery
            };

            const perspective: Object = {
                queryTabActive: this.queryTabActive,
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
}
