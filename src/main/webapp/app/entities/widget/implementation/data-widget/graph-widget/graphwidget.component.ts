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
    ChangeDetectorRef, TemplateRef, ViewChild, NgZone, ElementRef
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { SettingsNodeClass } from './settingsnodeclass.component';
import { SettingsEdgeClass } from './settingsedgeclass.component';
import { PrimaryWidget } from '../../primary-widget';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';

import * as $ from 'jquery';
import * as cytoscape from 'cytoscape';
import { Subject, Subscription, Observable } from 'rxjs';
import { FilterMenuComponent } from '../../common-menu/filtermenu.component';
import { JhiEventManager } from 'ng-jhipster';

import {
    PerformQueryModalComponent, PerformTraverseModalComponent, ShortestPathConfigModalComponent,
    PageRankConfigModalComponent, CentralityConfigModalComponent, AddEdgeModalComponent, AddNodeModalComponent
} from '../../modal';
import { DataWidgetComponent } from '../datawidget.component';
import { pageContentPadding } from '../../../../../global';
import { DataSourceService } from '../../../../data-source/data-source.service';

import { EdgeMenuComponent } from './menu/element-menu/edgemenu.component';
import { VertexMenuComponent } from './menu/element-menu/vertexmenu.component';
import { TableComponent } from '../../util-component/table/table.component';

const fileSaver = require('file-saver');
const randomColor = require('randomcolor');
const elementResizeEvent = require('element-resize-event');
import * as Viva from 'vivagraphjs';
import { DatasetUpdatedMessage, DatasetUpdatedMessageContent, SnapshotMenuComponent } from '../../..';
import { TimelineComponent } from '../../util-component';
import { SubsetSelectionChangeMessageContent, MessageType } from '../../../event-message';
import { TraverseMenuComponent } from './menu';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { DataSource } from 'app/entities/data-source';
import { Router } from '@angular/router';

@Component({
    selector: 'graph-widget',
    templateUrl: './graphwidget.component.html',
    styleUrls: ['./graphwidget.component.scss']
})
export class GraphWidgetComponent extends DataWidgetComponent implements PrimaryWidget, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges {

    subsetSelectionSubscription: Subscription;
    datasetPropagationRequestSubscription: Subscription;
    edgeClassChosenForNewEdgeSubscription: Subscription;
    nodeClassChosenForNewNodeSubscription: Subscription;

    edgeClassesStyles: Map<string, Object>;
    edgeClassesNames: string[] = [];
    nodeClassesStyles: Map<string, Object>;
    nodeClassesNames: string[] = [];
    defaultNodeClassSettings: Object;
    defaultEdgeClassSettings: Object;
    colors: string[] = [];
    loadingStyleClassSelectors: Object[] = [];

    startingWidgetHeight: string;
    sidebarHeight: string;
    toolbarHeight: string = '30px';
    GRAPH_REDUCED_SIZE_FOR_TIMELINE: string = '417px';
    GRAPH_REDUCED_SIZE_FOR_BOTTOM_TABLE: string = '315px';

    CY_ADDING_ELEMENTS_BATCH_SIZE: number = 1000;
    loadingNodes = [];     // used to store new graph nodes retrieved with the last query/snapshot
    loadingEdges = [];     // used to store new graph edges retrieved with the last query/snapshot
    loadingNodesPositions = {};     // used to store new graph elements retrieved with the last snapshot

    nodesNumber: number = 0;
    cy;
    cytoscapeInitialized: boolean = false;

    // selection
    lastSelectedElement: Element = undefined;
    classStyleOfLastSelectedElement: Object = undefined;
    classNameOfLastSelectedElement: string = undefined;
    selectedNodesCardinality: number = 0;
    // table input
    tableInputElementsCardinality: number = 0;
    tableInputClassNames: string[] = [];
    tableInputColumns: Object[] = [];

    // Cytoscape params
    GRAPH_FADED_OPACITY = 0.2;
    GRAPH_MAX_EDGES_ANIMATION = 3000;
    GRAPH_DEFAULT_ANIMATION_SPEED = 300;
    SELECTED_EDGE_PADDING = 10;

    // when there are more than CURRENT_NODES_THRESHOLD nodes in the viewport, a warning modal is shown to the user
    CURRENT_NODES_THRESHOLD = 5000;
    // when we are loading more than LOADING_CONNECTIONS_THRESHOLD, a warning modal is shown to the user
    LOADING_CONNECTIONS_THRESHOLD = 300;

    // Layout
    lastLayoutName = 'force';
    currentRunningLayout;
    runningLayoutTimeout;
    runningVivagraphLayoutTimeout;
    runningLayoutTimeThreshold: number = 2;

    // columns name config
    classNameColumnIncluded: boolean = true;

    // Legend variables
    graphLegendCollapsedVertices: boolean;
    graphLegendCollapsedEdges: boolean;
    graphLegendVerticesOrderedByCount: boolean = false;
    graphLegendEdgesOrderedByCount: boolean = false;
    totalLoadedVertices: number = 0;
    totalVertices: number = 0;
    totalLoadedEdges: number = 0;
    totalEdges: number = 0;
    hues: string[] = ['red', 'purple', 'orange', 'green', 'yellow', 'blue', 'pink'];
    hueIndex: number = 0;
    showLegend: boolean = true;

    // neighbour vertices ui sliders' variables
    neighbourStart: number[] = [1, 5];
    outNeighbourRange: number[];
    inNeighbourRange: number[];
    lastAppliedDepthRangeSelection: number[];
    neighbourSliderConfig: any;

    // settings' variables
    graphSpacingStart: number = this.getGraphSpacing();
    graphSpacing: number = this.graphSpacingStart;
    graphSpacingSliderConfig: any;
    autoLayout: boolean = true;
    showNodeLabels: boolean = true;
    showEdgeLabels: boolean = true;

    // nodes fetching
    nodeClassForNodeFetching: string;
    limitForNodeFetching: number = 10;

    // querying
    modalRef: BsModalRef;
    currentQuery: string = '';
    skipIsolatedNodes: boolean = false;
    skipEdgesNotInDataset: boolean = false;
    includesNodesOfEdge: boolean = false;
    startingPopoverMessage: string = 'Start your analysis by typing a query.';
    startingPopoverMustBeOpen: boolean = true;  // use to force the opening or closure of the popover

    // flag stating if the current dataset must be propagated to potential secondary widgets
    newDatasetToPropagate: boolean = false;

    // filtering
    @ViewChild('filterMenuComponent') filterMenu: FilterMenuComponent;
    filters: Object[] = [];
    startingFilters: Object[];  // used to get the old filters from the snapshot and pass them to the filter menu ad init time

    // graph element menu references
    @ViewChild('vertexMenuComponent') vertexMenu: VertexMenuComponent;
    @ViewChild('edgeMenuComponent') edgeMenu: EdgeMenuComponent;

    // table components' references
    @ViewChild('tabTable') tabTable: TableComponent;
    @ViewChild('bottomTable') bottomTable: TableComponent;
    outerAccordion: string = 'outer-accordion';
    innerAccordion: string = 'inner-accordion';

    // traverse menu
    @ViewChild('traverseMenu') traverseMenu: TraverseMenuComponent;
    instance: GraphWidgetComponent;

    // snapshot menu
    @ViewChild('snapshotMenu') snapshotMenu: SnapshotMenuComponent;

    // context menu
    contextMenuInstance;
    hideContextCommandRunning: boolean = false;
    showContextCommandRunning: boolean = false;
    traverseSubmenuActivated: boolean = false;
    traverseSubmenuLeft: string;
    traverseSubmenuTop: string;
    traverseSubmenuInputNodes: Element[] = [];  // always contains just one element, that is the last selected element
    pageContentPadding: number = pageContentPadding;
    widgetTableCellRightPadding: number;

    // nodes canvas layer
    nodesDegreeCanvasEnabled: boolean = true;
    nodesCanvasLayer;
    nodesCanvas;
    nodesCanvasContext;
    textCanvas;
    textContext;
    cardinalityCircleRadius: number;

    // timeline
    @ViewChild('timelineComponent') timelineComponent: TimelineComponent;
    newTimelineInputClass: string;
    newTimelineInputProperty: string;
    activateTimeline: boolean = false;
    timelineClassProperties: Object[];
    timelineInputItems: Object[];
    className2timelineDateInfo: Object = {};
    timelineChoosableClassesNames: string[];
    newTimelineInputClassType: string = 'node';
    tableColumns: Object[] = [
        {
            id: 'class',
            text: 'Class',
            width: '30%'
        },
        {
            id: 'dateProperty',
            text: 'Date Property',
            width: '55%'
        },
        {
            id: 'button',
            text: ''
        }
    ];
    timelineStartDate: Date = new Date('1900-01-01');
    timelineEndDate: Date = new Date('2099-12-31');
    timelineFilteringWindowStart: number;
    timelineFilteringWindowEnd: number;
    timelineFilteringWindowActive: boolean = false;

    // perspective
    tableTabEnabled: boolean = true;
    graphTabActive: boolean = true;
    tableTabActive: boolean = false;
    datasourceTabActive: boolean = false;

    // algorithms configs
    shortestPathConfig: Object;
    pageRankConfig: Object;
    centralityConfig: Object;

    // shortest path
    shortestPathSourceNode;
    shortestPathTargetNode;
    shortestPathSourceNodeInputLabel;
    shortestPathTargetNodeInputLabel;
    shortestPathSelectingNode;  // use to specify wich node we are selecting, 'from' or 'to'
    outputShortestPath;

    // edge handles and tmp variable
    cyEdgehandles;
    edgeHandlesColor: string = '#00ee00';
    tempAddingEdge;

    // force layout params
    forceLayoutDefaultParams: Object = {
        springLength: 400,
        springCoeff: 0.0008,
        dragCoeff: 0.01,
        gravity: -1.2,
        theta: 1
    };
    springLength: number = this.forceLayoutDefaultParams['springLength'];
    springLengthPopover: string = 'Ideal length of edges in pixels.';
    springCoeff: number = this.forceLayoutDefaultParams['springCoeff'];
    springCoeffPopover: string = 'Hook\'s law coefficient. The smaller number loosens edges length.';
    dragCoeff: number = this.forceLayoutDefaultParams['dragCoeff'];
    dragCoeffPopover: string = 'System cooldown coefficient. The larger it is the faster system will stop.';
    gravity: number = this.forceLayoutDefaultParams['gravity'];
    gravityPopover: string = `Coulomb\'s law coefficient. The smallest number makes repelling force stronger.\n\n
                                  Making it positive makes nodes attract each other.`;
    theta: number = this.forceLayoutDefaultParams['theta'];
    thetaPopover: string = `Barnes-Hut simulation coefficient. Values larger than 1 will make system converge faster\n\n
                                but not necessarily to the best layout.`;

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
        protected _host: ElementRef,
        protected router: Router) {

        super(principal, widgetService, notificationService, dataSourceService, eventManager, cdr, modalService, base64Service, widgetEventBusService,  router);

        this.instance = this;

        // default classes settings
        this.defaultNodeClassSettings = new SettingsNodeClass();
        this.defaultEdgeClassSettings = new SettingsEdgeClass();

        this.cardinalityCircleRadius = this.defaultNodeClassSettings['shapeWidth'] / 4;

        // neighbour lider config
        this.neighbourSliderConfig = {
            behaviour: 'drag',
            connect: true,
            start: this.neighbourStart,
            keyboard: false,  // same as [keyboard]='true'
            step: 1,
            pageSteps: 10,  // number of page steps, defaults to 10
            range: {
                min: 0,
                max: 10
            },
            pips: {
                mode: 'steps',
                density: 10,
                // values: 10,
                stepped: true
            }
        };

        // neighbour slider config
        this.graphSpacingSliderConfig = {
            behaviour: 'drag',
            connect: true,
            start: this.graphSpacingStart,
            keyboard: false,  // same as [keyboard]='true'
            // step: 1,
            // pageSteps: 12,  // number of page steps, defaults to 10
            range: {
                min: 0.1,
                max: 30
            },
            pips: {
                mode: 'steps',
                density: 10,
                values: 10,
                stepped: true
            }
        };

        // algorithms configs
        this.shortestPathConfig = {
            executionAlgorithm: 'dijkstra',
            directed: false,
            weightFields: {},
            allClassesIncluded: true,
            edgeClassesFilteredIn: []
        };
        this.pageRankConfig = {
            dampingFactor: 0.85,
            precision: 0.85,
            iterations: 30
        };
        this.centralityConfig = {
            executionAlgorithm: 'closeness-centrality',
            directed: false,
            weightFields: {},
            harmonic: true,
            nodeClassesFilteredIn: [],
            allClassesIncluded: true
        };

        this.outNeighbourRange = this.neighbourStart;
        this.inNeighbourRange = this.neighbourStart;

        this.edgeClassesStyles = new Map();
        this.nodeClassesStyles = new Map();
    }

    subscribeToEventBus() {

        this.subsetSelectionSubscription = this.widgetEventBusService.getMessage(MessageType.SUBSET_SELECTION_CHANGE).subscribe((message) => {
            if (message.data['primaryWidgetId'] === this.widget.id) {
                if (this.cy) {
                    this.onSubsetSelection(message.data);
                } else {
                    const message = '[GraphWidget - ' + this.widget.name + '] Cytoscape not initialised, cannot perform any selection.';
                    console.log(message);
                }
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

        this.subscribeToEventBus();

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

        this.graphLegendCollapsedEdges = true;
        if (!this.minimizedView) {
            this.graphLegendCollapsedVertices = false;
        } else {
            this.graphLegendCollapsedVertices = true;
        }

        if (this.oldSnapshotToLoad) {
            // load snapshot
            this.loadSnapshot();
            this.startingPopoverMustBeOpen = false;
        } else {
            // first metadata request in order to fetch
            // all the metadata about nodes and edges classes with the related cardinalities
            if (!this.minimizedView) {
                this.dataSourceService.loadMetadata(datasourceId).subscribe((dataSourceMetadata: Object) => {
                    this.dataSourceMetadata = dataSourceMetadata;

                    // intit nodes and edges classes styles
                    this.udateCyMetadataFromCurrDatasourceMetadata();
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
        this.registerAddingElementsEvents();

        if (!this.embedded) {
            // authorities and depending params init
            this.initParamsDependingOnUserIdentities();
        }
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

    registerAddingElementsEvents() {
        this.edgeClassChosenForNewEdgeSubscription = this.eventManager.subscribe('edgeClassChosenForNewEdge', (event) => {
            this.onEdgeClassNameChosenForNewEdge(event);
        });

        this.nodeClassChosenForNewNodeSubscription = this.eventManager.subscribe('nodeClassChosenForNewNode', (event) => {
            this.onNodeClassNameChosenForNewEdge(event);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {}

    ngOnDestroy() {
        this.eventManager.destroy(this.dashboardPanelResizedSubscriber);
        this.eventManager.destroy(this.subsetSelectionSubscription);
        this.eventManager.destroy(this.datasetPropagationRequestSubscription);
        this.eventManager.destroy(this.edgeClassChosenForNewEdgeSubscription);
        this.eventManager.destroy(this.nodeClassChosenForNewNodeSubscription);

        // destroying context menu instance if any
        if (this.contextMenuInstance) {
            this.contextMenuInstance.destroy();
        }

        this.unsubscribeToEventBus();
    }

    ngAfterViewInit() {

        if (!this.embedded) {
            this.startingWidgetHeight = this.widgetHeight;

            // sidebar height
            if (this.minimizedView) {
                this.sidebarHeight = this.widgetHeight;
            } else {
                const numericWidgetHeight: number = parseInt(this.widgetHeight.replace('px', ''), 10);
                const tabsHeight = 40;
                this.sidebarHeight = numericWidgetHeight + tabsHeight + 'px';
            }
        } else {
            this.adjustWidgetHeightToEmbeddingIframeHeight();
        }

        this.sidebarResetMenu();

        // possible overflow handling
        this.tooltipOnOverflow();

        // initialising padding values
        this.widgetTableCellRightPadding = parseInt((<any>$('.sidebar')).css('padding-right'), 10);

        // attach listener to resize event
        const elementId = '#widget-viewport_' + this.widgetId;
        const element = $(elementId).get(0);
        elementResizeEvent(element, () => {
            if (this.tableTabEnabled) {
                if (this.graphTabActive && this.cy) {
                    this.cy.resize();
                    this.fitAndCenterViewport();
                }
            } else {
                this.cy.resize();
                this.fitAndCenterViewport();
            }
        });

        if (this.minimizedView) {
            // hide tabs
            (<any>$('.widget-viewport .tab-container ul')).css('display', 'none');
        } else {
            // init legend draggable behaviou when present
            this.initLegendDraggable();
        }
    }

    initLegendDraggable() {
        const legend = (<any>$('.graph-legend')).get(0);
        if (legend) {
            (<any>$('.graph-legend')).draggable({
                containment: '.viewport'
            });
        } else {
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.initLegendDraggable();
                }, 100);
            });
        }
    }

    ngAfterViewChecked() { }

    tooltipOnOverflow() {
        (<any>$('.mightOverflow')).bind('mouseover', function() {
            const $this = $(this);
            const width = (<any>$('span')).width();
            if (this.offsetWidth > width && !$this.attr('title')) {
                $this.attr('title', $this.text());
            }
        });
    }

    checkLegendShowing() {
        if (this.showLegend) {
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.tooltipOnOverflow();
                }, 100);
            });
        }
    }

    getLastSelectedElementType() {
        return (<any>this.lastSelectedElement).data.type;
    }

    closePopover(popoverName: string) {
        if (popoverName === 'startingPopover') {
            if (this.startingPopoverMustBeOpen) {
                this.startingPopoverMustBeOpen = false;
            }
        }
    }

    resetForceLayoutParamsToDefault() {
        this.springLength = this.forceLayoutDefaultParams['springLength'];
        this.springCoeff = this.forceLayoutDefaultParams['springCoeff'];
        this.dragCoeff = this.forceLayoutDefaultParams['dragCoeff'];
        this.gravity = this.forceLayoutDefaultParams['gravity'];
        this.theta = this.forceLayoutDefaultParams['theta'];
    }

    /**
     * Perspective
     */

    switchTab(justChosenTab: string) {
        if (justChosenTab === 'graph') {
            this.graphTabActive = true;
            this.tableTabActive = false;
            this.datasourceTabActive = false;

            // tabs switching bug: when we switch to the graph tab we nedd to call the cytoscape core resize method
            this.resizeGraphTabWhenActive();
        } else if (justChosenTab === 'table') {
            this.graphTabActive = false;
            this.tableTabActive = true;
            this.datasourceTabActive = false;
            this.manuallyHideAndCleanContextMenu();

            // table updating
            this.updateTable();
        } else if (justChosenTab === 'datasource') {
            this.graphTabActive = false;
            this.tableTabActive = false;
            this.datasourceTabActive = true;
            this.manuallyHideAndCleanContextMenu();
        }
    }

    // It calls the cytoscape core resize method as soon as the graph tab is completely switched.
    resizeGraphTabWhenActive() {
        const waitDelay: number = 25;
        const graphTabActive = (<any>$('#graphTab')).hasClass('active');
        if (graphTabActive && this.cy) {
            this.cy.resize();
            this.fitAndCenterViewport();
        } else {
            // wait a while and try again
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.resizeGraphTabWhenActive();
                }, waitDelay);
            });
        }
    }

    /**
     * Returns an Observable of true when the filtering menu was actually triggered.
     * In this way we can always start the layout after the actual node ids are collected.
     */
    updateFilteringMenu(): Observable<boolean> {

        if (this.dataSource && this.dataSource['indexing'] &&
            this.dataSource['indexing'].toString() === 'INDEXED') {

            const currentGraphNodesIds: string[] = [];
            this.cy.batch(() => {
                this.cy.nodes().forEach((node) => {
                    currentGraphNodesIds.push(node.id());
                });
            });
            if (this.filterMenu) {
                // filter menu already initialised
                this.filterMenu.updateFilteringMenu(currentGraphNodesIds);
                return Observable.of(true);
            } else {
                // waiting for filter menu initialisation
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        return this.updateFilteringMenu().subscribe(() => {
                            // DO NOTHING
                        }, (error) => {
                            console.log('Filter menu not initialised yet.');
                        });
                    }, 500);
                });
            }
        } else {
            this.notificationService.push('warning', 'Filter menu', 'Cannot update the filter menu as no index is defined over the data source.');
            return Observable.of(true);
        }
    }

    /**
     * It performs all the operations that must be performed after the indexing process completion.
     */
    performOperationsAfterIndexingComplete() {

        // filter menu update
        if (this.cy && this.cy.nodes().length > 0) {
            this.updateFilteringMenu().subscribe(() => {
                console.log('Filtering menu updated after the new indexing was performed.');
            });
        }
    }

    // SEARCH IN CYTOSCAPE

    handleSearchOnKeydown(event) {
        if (event.keyCode === 13) {
            this.searchInCytoscape();
        }
    }

    searchInCytoscape() {

        this.startSpinner();

        let nodes;

        this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {

                if (this.cy) {

                    // input search string normalization
                    let search: string = this.inputSearch.trim();
                    search = search.toLowerCase();
                    if (search.indexOf(' or ') >= 0) {
                        search = search.replace(/ or /g, ' OR ');
                    } else {
                        search = search.replace(/ /g, ' AND ');
                    }

                    nodes = this.cy.nodes().filter((node) => {

                        let filterIn: boolean = false;
                        const record = node.data().record;

                        // adding the node id in the record
                        record['id'] = node.id();

                        if (search.indexOf(' OR ') > 0) {
                            // OR operator applied on all the keywords
                            for (const currentProperty of Object.keys(record)) {
                                const propValue = record[currentProperty];
                                let value: string;

                                // converting propValue in string if needed
                                if (typeof propValue !== 'string') {
                                    value = propValue + '';
                                } else {
                                    value = propValue.slice(0);    // copying the value
                                }

                                // normalizing the propValue and the search input
                                value = value.toLowerCase();

                                if (this.recursiveOrQueryOnField(search, value)) {
                                    filterIn = true;
                                    break;
                                }
                            }
                        } else {
                            // AND operator applied on all the keywords
                            for (const currentProperty of Object.keys(record)) {
                                const propValue = record[currentProperty];
                                let value: string;

                                // converting propValue in string if needed
                                if (typeof propValue !== 'string') {
                                    value = propValue + '';
                                } else {
                                    value = propValue.slice(0);    // copying the value
                                }

                                // normalizing the propValue and the search input
                                value = value.toLowerCase();

                                if (this.recursiveAndQueryOnField(search, value)) {
                                    filterIn = true;
                                    break;
                                }
                            }
                        }

                        return filterIn;
                    });

                    const numberOfNodes = nodes.length;
                    this.cy.elements().unselect();

                    // selecting nodes if any
                    if (numberOfNodes > 0) {
                        nodes.select();
                    }
                    this.stopSpinner();

                    let message: string;
                    if (numberOfNodes === 1) {
                        message = '1 node found.';
                    } else {
                        message = numberOfNodes + ' nodes found.';
                    }
                    this.notificationService.push('success', 'Search', message);
                } else {
                    this.stopSpinner();
                    const message: string = 'There are non nodes in the viewport. Search cannot be performed.';
                    this.notificationService.push('warning', 'Search', message);
                }
            }, 10);
        });
    }

    /*
    * Filtering auxiliar functions: search of clauses containing all AND or all OR
    */

    recursiveAndQueryOnField(clause, fieldValue): boolean {

        if (clause.indexOf(' AND ') < 0) {
            // base case
            if (fieldValue.indexOf(clause) >= 0) {
                return true;
            } else {
                return false;
            }
        } else {
            // inductive case
            const split = clause.split(' AND ');
            const firstPredicate = split[0];
            const rest = split.slice(1).join(' AND ');
            if (fieldValue.indexOf(firstPredicate) >= 0) {
                return true && this.recursiveAndQueryOnField(rest, fieldValue);
            } else {
                return false;
            }
        }
    }

    recursiveOrQueryOnField(clause, fieldValue): boolean {

        if (clause.indexOf(' OR ') < 0) {
            // base case
            if (fieldValue.indexOf(clause) >= 0) {
                return true;
            } else {
                return false;
            }
        } else {
            // inductive case
            const split = clause.split(' OR ');
            const firstPredicate = split[0];
            const rest = split.slice(1).join(' OR ');
            if (fieldValue.indexOf(firstPredicate) >= 0) {
                return true || this.recursiveOrQueryOnField(rest, fieldValue);
            } else {
                return false || this.recursiveOrQueryOnField(rest, fieldValue);
            }
        }
    }

    getEmptyWidgetMessageHeight() {
        const widgetHeight: number = parseInt(this.widgetHeight.replace('px', ''), 10);
        const top: string = widgetHeight / 3 + 'px';
        return top;
    }

    /**
     * Modals handling
     */

    openNodesFetchingModal(template: TemplateRef<any>) {
        this.modalRef = this.modalService.show(template, { class: 'modal-sm' });
    }

    openQueryModal(template: TemplateRef<any>) {
        this.modalRef = this.modalService.show(template);
    }

    openShortestPathConfigModal() {

        const edgeClassesNames: string[] = [];
        for (const currEdgeClassName of this.edgeClassesNames) {
            if (this.getClassProperties('edge', currEdgeClassName).length > 0) {
                edgeClassesNames.push(currEdgeClassName);
            }
        }

        this.modalRef = this.modalService.show(ShortestPathConfigModalComponent);
        this.modalRef.content.config = this.shortestPathConfig;
        this.modalRef.content.initFilteredInEdgeClasses();
        this.modalRef.content.choosableEdgeClassesNames = edgeClassesNames;
        this.modalRef.content.parent = this;
        this.modalRef.content.shortestPathConfigSave.subscribe((event) => {
            this.shortestPathConfig = event['config'];
        });
    }

    openPageRankConfigModal() {
        this.modalRef = this.modalService.show(PageRankConfigModalComponent, { class: 'modal-sm' });
        this.modalRef.content.config = this.pageRankConfig;
        this.modalRef.content.parent = this;
        this.modalRef.content.pageRankConfigSave.subscribe((event) => {
            this.pageRankConfig = event['config'];
        });
    }

    openCentralityConfigModal() {

        const edgeClassesNames: string[] = [];
        for (const currEdgeClassName of this.edgeClassesNames) {
            if (this.getClassProperties('edge', currEdgeClassName).length > 0) {
                edgeClassesNames.push(currEdgeClassName);
            }
        }

        const nodeClassesNames: string[] = [];
        for (const currNodeClassName of this.nodeClassesNames) {
            if (this.getClassProperties('node', currNodeClassName).length > 0) {
                nodeClassesNames.push(currNodeClassName);
            }
        }

        this.modalRef = this.modalService.show(CentralityConfigModalComponent);
        this.modalRef.content.config = this.centralityConfig;
        this.modalRef.content.initFilteredInNodeClasses();
        this.modalRef.content.choosableEdgeClassesNames = edgeClassesNames;
        this.modalRef.content.choosableNodeClassesNames = nodeClassesNames;
        this.modalRef.content.parent = this;
        this.modalRef.content.centralityConfigSave.subscribe((event) => {
            this.centralityConfig = event['config'];
        });
    }

    loadElementsFromSnapshot(snapshot) {

        this.loadingNodes = [];
        this.loadingEdges = [];
        this.loadingNodesPositions = {};

        if (snapshot.elements.nodes) {
            for (const node of snapshot.elements.nodes) {
                this.loadingNodes.push(node);
                this.loadingNodesPositions[node.data.id] = {
                    x: node.position.x,
                    y: node.position.y
                };
            }
        }
        if (snapshot.elements.edges) {
            for (const edge of snapshot.elements.edges) {
                this.loadingEdges.push(edge);
            }
        }
    }

    updateCytoscapeFromSnapshot(snapshot) {

        // if cytoscape is already initialised we are not performing the first loading,
        // then we have to destroy the cytoscape instance before a new initialisation.
        if (this.cytoscapeInitialized) {
            this.ngZone.runOutsideAngular(() => {
                this.cy.destroy();
                this.cy = undefined;
            });
            this.cytoscapeInitialized = false;
        }

        this.nodeClassesStyles = new Map(JSON.parse(snapshot.nodeClasses));
        this.edgeClassesStyles = new Map(JSON.parse(snapshot.edgeClasses));
        this.nodeClassesNames = Array.from(this.nodeClassesStyles.keys());
        this.edgeClassesNames = Array.from(this.edgeClassesStyles.keys());

        // loading metadata
        if (snapshot['dataSourceMetadata']) {
            this.dataSourceMetadata = snapshot['dataSourceMetadata'];
        }

        // preparing data loading
        this.loadElementsFromSnapshot(snapshot);

        if (!this.minimizedView) {
            if (!this.newTimelineInputClass) {
                this.newTimelineInputClass = this.nodeClassesNames[0];
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        this.updateTimelineClassProperties();
                    }, 1000);
                });
            }
        }

        this.newDatasetToPropagate = snapshot['newDatasetToPropagate'];
        if (this.newDatasetToPropagate && this.minimizedView) {
            this.propagateDatasetMulticastChangeFromSnapshot(snapshot);
            this.newDatasetToPropagate = false;
            this.saveAll(true);
        }

        const cont = document.getElementById('cy_' + this.widgetId);

        // cleaning saved input style classes
        const styleClassSelectors = snapshot.style;
        for (const currentStyle of styleClassSelectors) {

            // cy bug fix (percentage omitted): updating background fields if present with percentage values
            if (currentStyle['style']['background-width'] && currentStyle['style']['background-height']) {
                currentStyle['style']['background-width'] = '70%';
                currentStyle['style']['background-height'] = '70%';
            }

            // escaping special characters on style classes loading
            if (currentStyle['selector'].indexOf('node.') >= 0) {
                const className = currentStyle['selector'].replace('node.', '');
                currentStyle['selector'] = 'node.' + this.escapeSelector(className);
            } else if (currentStyle['selector'].indexOf('edge.') >= 0) {
                const className = currentStyle['selector'].replace('edge.', '');
                currentStyle['selector'] = 'edge.' + this.escapeSelector(className);
            }
        }

        if (this.minimizedView) {
            // reduce zoom
            snapshot.zoom = 0.4;
            snapshot.pan = { x: 0, y: 0 };
        }

        if (snapshot['nodesDegreeCanvasEnabled'] !== undefined) {
            this.nodesDegreeCanvasEnabled = snapshot['nodesDegreeCanvasEnabled'];
        }

        this.ngZone.runOutsideAngular(() => {

            this.cy = cytoscape({

                container: cont,
                elements: this.loadingNodes.concat(this.loadingEdges),
                style: snapshot.style,

                zoom: snapshot.zoom,
                pan: snapshot.pan,

                minZoom: snapshot.minZoom,
                maxZoom: snapshot.maxZoom,
                zoomingEnabled: snapshot.zoomingEnabled,
                userZoomingEnabled: snapshot.userZoomingEnabled,
                panningEnabled: snapshot.panningEnabled,
                userPanningEnabled: snapshot.userPanningEnabled,
                boxSelectionEnabled: snapshot.boxSelectionEnabled,
                selectionType: 'additive',      // ORIGINAL WAS 'single'
                touchTapThreshold: 8,
                desktopTapThreshold: 4,
                autolock: false,
                autoungrabify: false,
                autounselectify: false,
                layout: {
                    name: 'preset'
                },

                headless: false,
                styleEnabled: true,
                hideEdgesOnViewport: snapshot.hideEdgesOnViewport,
                hideLabelsOnViewport: true,  // ORIGINAL WAS FALSE
                renderer: snapshot.renderer,
                textureOnViewport: snapshot.textureOnViewport,
                motionBlur: snapshot.motionBlur,
                motionBlurOpacity: 0.2,
                wheelSensitivity: snapshot.wheelSensitivity,
                pixelRatio: 'auto'
            });

            this.nodesCanvasLayer = this.cy.cyCanvas({
                zIndex: 1,
                pixelRatio: 'auto'
            });
            this.nodesCanvas = this.nodesCanvasLayer.getCanvas();
            this.nodesCanvasContext = this.nodesCanvas.getContext('2d');
            this.textCanvas = this.nodesCanvasLayer.getCanvas();
            this.textContext = this.textCanvas.getContext('2d');

            // the default values of each option are outlined below:
            const cyEdgehandlesOptions = {
                preview: true, // whether to show added edges preview before releasing selection
                hoverDelay: 150, // time spent hovering over a target node before it is considered selected
                handleNodes: 'node', // selector/filter function for whether edges can be made from a given node
                snap: false, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
                snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
                snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
                noEdgeEventsInDraw: false, // set events:no to edges during draws, prevents mouseouts on compounds
                disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
                handlePosition: function(node) {
                    return 'middle top'; // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
                },
                handleInDrawMode: false, // whether to show the handle in draw mode
                edgeType: function(sourceNode, targetNode) {
                    // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
                    // returning null/undefined means an edge can't be added between the two nodes
                    return 'flat';
                },
                loopAllowed: function(node) {
                    // for the specified node, return whether edges from itself to itself are allowed
                    return false;
                },
                nodeLoopOffset: -50, // offset for edgeType: 'node' loops
                nodeParams: function(sourceNode, targetNode) {
                    // for edges between the specified source and target
                    // return element object to be passed to cy.add() for intermediary node
                    return {};
                },
                edgeParams: function(sourceNode, targetNode, i) {
                    // for edges between the specified source and target
                    // return element object to be passed to cy.add() for edge
                    // NB: i indicates edge index in case of edgeType: 'node'
                    return {};
                },
                ghostEdgeParams: function() {
                    // return element object to be passed to cy.add() for the ghost edge
                    // (default classes are always added for you)
                    return {};
                },
                start: function(sourceNode) {
                    // fired when edgehandles interaction starts (drag on handle)
                },
                complete: (sourceNode, targetNode, addedEles) => {
                    this.onAddEdgeAnimationComplete(sourceNode, targetNode, addedEles);
                },
                hoverover: function(sourceNode, targetNode) {
                    // fired when a target is hovered
                },
                drawon: function() {
                    // fired when draw mode enabled
                },
                drawoff: () => {
                    // fired when draw mode disabled
                },
                cancel: () => {
                    // fired when edgehandles are cancelled (incomplete gesture)
                    this.disableCyEdgeHandles();
                },
                stop: () => {
                    // fired when edgehandles are cancelled (incomplete gesture)
                    this.disableCyEdgeHandles();
                }
            };

            this.cyEdgehandles = this.cy.edgehandles(cyEdgehandlesOptions);
            this.cyEdgehandles.disable();
        });

        this.cytoscapeInitialized = true;
        this.applyPanzoomToCytoscape(snapshot);

        this.graphSpacing = snapshot['spacingFactor'];    // not used during preset layout applying
        this.showLegend = snapshot['showLegend'];       // retrieving the show-legend settings from the snapshot
        this.lastLayoutName = snapshot['lastLayoutName'];     // fetching last layout name from the snapshot
        this.autoLayout = snapshot['autoLayout'];       // fetching auto layout settings from the snapshot
        if (snapshot['timelineOptions']) {
            // fetching the timeline options
            this.className2timelineDateInfo = snapshot['timelineOptions']['timelineInput'];
            this.timelineStartDate = new Date(snapshot['timelineOptions']['timelineStartDate']);
            this.timelineEndDate = new Date(snapshot['timelineOptions']['timelineEndDate']);
            this.timelineFilteringWindowStart = snapshot['timelineOptions']['timelineFilteringWindowStart'];
            this.timelineFilteringWindowEnd = snapshot['timelineOptions']['timelineFilteringWindowEnd'];
            this.timelineFilteringWindowActive = snapshot['timelineOptions']['timelineFilteringWindowActive'];
        }
        if (!this.minimizedView && snapshot['perspective']) {

            // executing before the table switch, then the timeline one
            // because if the table tab is active the graph viewport is full size and can overwrtite
            // the minimized viewport size even though the timeline is active
            this.tableTabEnabled = snapshot['perspective']['tableTabEnabled'];
            this.handleTablePerspectiveSwitch();
            this.activateTimeline = snapshot['perspective']['activateTimeline'];
            this.handleTimelineSwitch();

            this.graphTabActive = snapshot['perspective']['graphTabActive'];
            this.tableTabActive = snapshot['perspective']['tableTabActive'];
            this.datasourceTabActive = snapshot['perspective']['datasourceTabActive'];
        }
        if (snapshot['algorithmsConfigs']) {
            if (snapshot['algorithmsConfigs']['shortestPath']) {
                this.shortestPathConfig = snapshot['algorithmsConfigs']['shortestPath'];
            }
            if (snapshot['algorithmsConfigs']['pageRank']) {
                this.pageRankConfig = snapshot['algorithmsConfigs']['pageRank'];
            }
            if (snapshot['algorithmsConfigs']['centrality']) {
                this.centralityConfig = snapshot['algorithmsConfigs']['centrality'];
            }
        }

        if (snapshot['forceLayoutParams']) {
            if (snapshot['forceLayoutParams']['springCoeff']) {
                this.springCoeff = snapshot['forceLayoutParams']['springCoeff'];
            }
            if (snapshot['forceLayoutParams']['springLength']) {
                this.springLength = snapshot['forceLayoutParams']['springLength'];
            }
            if (snapshot['forceLayoutParams']['dragCoeff']) {
                this.dragCoeff = snapshot['forceLayoutParams']['dragCoeff'];
            }
            if (snapshot['forceLayoutParams']['gravity']) {
                this.gravity = snapshot['forceLayoutParams']['gravity'];
            }
            if (snapshot['forceLayoutParams']['theta']) {
                this.theta = snapshot['forceLayoutParams']['theta'];
            }
        }

        if (snapshot['runningLayoutTimeThreshold']) {
            this.runningLayoutTimeThreshold = snapshot['runningLayoutTimeThreshold'];
        }

        if (snapshot['showNodeLabels'] !== undefined) {
            this.showNodeLabels = snapshot['showNodeLabels'];
        }

        if (snapshot['showEdgeLabels'] !== undefined) {
            this.showEdgeLabels = snapshot['showEdgeLabels'];
        }

        if (snapshot['filters']) {
            this.filters = snapshot['filters'];
            if (this.filters.length > 0) {
                this.startingFilters = this.filters.slice();
            }
        }

        if (snapshot['tableInputElementsCardinality']) {
            this.tableInputElementsCardinality = snapshot['tableInputElementsCardinality'];
        }

        this.initSelection(this.cy.elements());

        if (snapshot['tableInputClassNames']) {
            this.tableInputClassNames = snapshot['tableInputClassNames'];
        }

        if (snapshot['tableInputColumns']) {
            this.tableInputColumns = snapshot['tableInputColumns'];
        }

        if (snapshot['classNameColumnIncluded'] !== undefined) {
            this.classNameColumnIncluded = snapshot['classNameColumnIncluded'];
        }

        if (snapshot['shortestPathSourceNodeId']) {
            this.shortestPathSourceNode = this.cy.getElementById(snapshot['shortestPathSourceNodeId']);
        }
        if (snapshot['shortestPathSourceNodeInputLabel']) {
            this.shortestPathSourceNodeInputLabel = snapshot['shortestPathSourceNodeInputLabel'];
        }
        if (snapshot['shortestPathTargetNodeId']) {
            this.shortestPathTargetNode = this.cy.getElementById(snapshot['shortestPathTargetNodeId']);
        }
        if (snapshot['shortestPathTargetNodeInputLabel']) {
            this.shortestPathTargetNodeInputLabel = snapshot['shortestPathTargetNodeInputLabel'];
        }
        if (snapshot['outputShortestPathIds']) {
            this.outputShortestPath = this.cy.collection();
            snapshot['outputShortestPathIds'].forEach((elemId) => {
                const elem = this.cy.$('#' + elemId);
                this.outputShortestPath.merge(elem);
            });
        }

        this.totalVertices = snapshot['totalVertices'];
        this.totalEdges = snapshot['totalEdges'];

        this.applyEventsToCytoscape();
        if (!this.minimizedView) {
            this.applyContextMenu();
        }

        // legend count
        if (!this.minimizedView) {
            this.graphUpdateLegend();
        }

        // cleaning loading elements' arrays
        this.loadingNodes = [];
        this.loadingEdges = [];
        this.loadingNodesPositions = {};

        if (this.minimizedView) {
            // changing the zoom to fit the reduced viewport
            this.cy.ready(() => {
                if (this.currentRunningLayout) {
                    this.cy.on('layoutstop', (event) => {
                        this.cy.centre();
                        this.cy.fit();
                        this.stopSpinner();
                    });
                }
            });
        }

        // stopping spinner when the snapshot was loaded
        this.cy.ready(() => {
            this.stopSpinner();
        });

        // old metadata were already loaded, but we perform another call in order to
        // get updated with potential datasource schema changes, iff the widget is not embedded
        if (!this.embedded) {
            this.dataSourceService.loadMetadata(this.widget['dataSourceId']).subscribe((dataSourceMetadata: Object) => {
                this.updateDatasourceMetadataFromData(dataSourceMetadata);
                this.udateCyMetadataFromCurrDatasourceMetadata();
            }, (error: HttpErrorResponse) => {
                this.handleError(error.error, 'Metadata loading');
            });
        }

        this.toSave = false;
    }

    // triggered after the node class name of the current adding-node has been chosen
    onNodeClassNameChosenForNewEdge(event: Object) {

        const className: string = event['nodeClassName'];

        if (event['action'] === 'save') {
            // add new node class
            const newNode = {
                group: 'nodes',
                data: {
                    type: 'v',
                    class: className,
                    edgeCount: 0,
                    record: { '@in': {}, '@out': {} }
                },
                selected: false, // whether the element is selected (default false)
                selectable: true, // whether the selection state is mutable (default true)
                locked: false, // when locked a node's position is immutable (default false)
                grabbable: true, // whether the node can be grabbed and moved by the user
                classes: className,
            };

            this.graphUnselectAll();

            const addedNode = this.cy.add(newNode)
            // .addClass(className)
            .select();

            const x = addedNode.json();

            const message = 'New node ' + addedNode.id() + ' correctly added.';
            this.notificationService.push('success', 'Add Node', message);

            if (this.applyLastLayout) {
                this.applyLastLayout();
            }
        }

    }

    onAddEdgeAnimationComplete(sourceNode: any, targetNode: any, addedEles: any): any {
        this.tempAddingEdge = addedEles[0];

        // let the user choose the edge class through a modal
        const modalRef = this.modalService.show(AddEdgeModalComponent);
        modalRef.content.edgeClassesNames = this.edgeClassesNames;
        modalRef.content.sourceNode = sourceNode.json();
        modalRef.content.targetNode = targetNode.json();
    }

    // triggered after the edge class name of the current adding-edge has been chosen
    onEdgeClassNameChosenForNewEdge(event: Object) {

        const className: string = event['edgeClassName'];

        if (event['action'] === 'save') {
            // add edge class
            this.tempAddingEdge.addClass(className);
            this.tempAddingEdge.data('class', className);
            this.tempAddingEdge.data('type', 'e');
            this.tempAddingEdge.data('record', { '@in': {}, '@out': {} });

            this.graphUnselectAll();
            this.tempAddingEdge.select();

            const message = 'New edge from ' + event['sourceNode']['data']['id'] + ' to ' + event['sourceNode']['data']['id'] + ' correctly added.';
            this.notificationService.push('success', 'Add Edge', message);
        } else if (event['action'] === 'cancel') {
            this.tempAddingEdge.remove();
        }

        // leaving add-edge mode
        this.leaveAddEdgeMode();
    }

    leaveAddEdgeMode() {
        this.disableCyEdgeHandles();
        this.tempAddingEdge = undefined;
    }

    enableCyEdgeHandles() {
        this.cyEdgehandles.enable();
        const message = 'Hover a source node, drag the new edge from the red handle and drop it on a target node.';
        this.notificationService.push('info', 'Add Edge', message);
    }

    disableCyEdgeHandles() {
        this.cyEdgehandles.disable();
    }

    openAddNodeModal() {
        const modalRef = this.modalService.show(AddNodeModalComponent);
        modalRef.content.nodeClassesNames = this.nodeClassesNames;
    }

    initSelection(elements) {
        this.updateCurrentSelectionStatus(elements);
    }

    /**
     * Used to propagate a dataset change in multicast to all the secondary widgets. It's performed after the snapshot loading in the minimized view.
     * @param snapshot
     */
    propagateDatasetMulticastChangeFromSnapshot(snapshot: Object): void {
        let elements = snapshot['elements']['nodes'];
        if (!elements) {
            elements = [];
        }
        if (snapshot['elements']['edges']) {
            elements = elements.concat(snapshot['elements']['edges']);
        }
        const cleanedDatasourceMetadata = this.cleanDatasourceMetadataForSecondaryWidget(snapshot['dataSourceMetadata'], elements);
        const content: DatasetUpdatedMessageContent = this.buildDatasetUpdateMessageContent(elements, cleanedDatasourceMetadata);
        this.widgetEventBusService.publish(MessageType.DATASET_UPDATED_MESSAGE, new DatasetUpdatedMessage(content));
    }

    /**
     * Used to propagate dataset after a request from a specific secondary widget.
     */
    propagateDatasetTo(secondaryWidgetId: number) {
        let elements: Object[];
        if (this.cy) {
            elements = this.cy.elements().jsons();
        } else {
            elements = [];
        }
        const cleanedDatasourceMetadata = this.cleanDatasourceMetadataForSecondaryWidget(this.dataSourceMetadata, elements);
        const content: DatasetUpdatedMessageContent = this.buildDatasetUpdateMessageContent(elements, cleanedDatasourceMetadata, secondaryWidgetId);
        this.widgetEventBusService.publish(MessageType.DATASET_UPDATED_MESSAGE, new DatasetUpdatedMessage(content));
    }

    buildDatasetUpdateMessageContent(elements: Object[], dataSourceMetadata: Object, secondaryWidgetId?: number): DatasetUpdatedMessageContent {
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

    fitAndCenterViewport(delay?: number) {

        if (this.cy) {
            if (delay) {
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        this.cy.fit();
                        this.cy.centre();
                    }, delay);
                });
            } else {
                this.cy.fit();
                this.cy.centre();
            }
        }
    }

    updateCytoscapeFromLayout(snapshot) {

        if (snapshot.elements.nodes) {
            for (const node of Object.keys(snapshot.elements.nodes)) {
                this.loadingNodesPositions[node] = {
                    x: snapshot.elements.nodes[node].x,
                    y: snapshot.elements.nodes[node].y
                };
            }
        }

        this.graphApplyLayoutPreset(false);
    }

     /**
      * Adds all the info from the last loaded data from the datasource. It returns the new entering elements in the dataset.
      * @param data
      * @param traversing
      * @param selectEnteringNodes
      * @param queryJsonInfo
      */
    updateCytoscapeFromQueryData(data, traversing: boolean, selectEnteringNodes?: boolean, queryJsonInfo?: Object) {

        let t = new Date();
        console.log('updateDatasourceMetadata: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');
        this.updateDatasourceMetadataFromData(data);
        t = new Date();
        console.log('updateDatasourceMetadata: done (' + t + ', ms: ' + t.getMilliseconds() + ')\n');

        this.udateCyMetadataFromCurrDatasourceMetadata();

        t = new Date();
        console.log('updateCytoscapeData: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');
        this.updateCytoscapeData(data);
        t = new Date();
        console.log('updateCytoscapeData: done (' + t + ', ms: ' + t.getMilliseconds() + ')\n');

        if (!this.cytoscapeInitialized) {

            const cont = document.getElementById('cy_' + this.widgetId);

            /*
            * Style selectors
            */

            const nodeSelector = {
                selector: 'node',
                style: {
                    'border-width': this.defaultNodeClassSettings['borderWidth'],
                    'border-color': this.defaultNodeClassSettings['borderColor'],
                    // 'label': this.defaultNodeClassSettings['label'],
                    'font-family': this.defaultNodeClassSettings['labelFontFamily'],
                    'font-size': this.defaultNodeClassSettings['labelFontSize'],
                    'min-zoomed-font-size': this.defaultNodeClassSettings['minZoomedFontSize'],
                    'width': this.defaultNodeClassSettings['shapeWidth'],
                    'height': this.defaultNodeClassSettings['shapeHeight'],
                }
            };
            if (this.defaultNodeClassSettings['shapeImage']) {
                nodeSelector.style['background-fit'] = 'none';
                nodeSelector.style['background-width'] = '70%';
                nodeSelector.style['background-height'] = '70%';
                nodeSelector.style['background-image'] = this.defaultNodeClassSettings['shapeImage'];
            }

            const edgeSelector = {
                selector: 'edge',
                style: {
                    'font-family': this.defaultEdgeClassSettings['labelFontFamily'],
                    'font-size': this.defaultEdgeClassSettings['labelFontSize'],
                    'line-color': this.defaultEdgeClassSettings['lineColor'],
                    'width': this.defaultEdgeClassSettings['width'],
                    'text-margin-y': this.defaultEdgeClassSettings['textMarginY'],
                    'target-arrow-color': this.defaultEdgeClassSettings['targetArrowColor'],
                    'target-arrow-shape': this.defaultEdgeClassSettings['targetArrowShape'],
                    'min-zoomed-font-size': this.defaultEdgeClassSettings['minZoomedFontSize'],
                    'edge-distances': this.defaultEdgeClassSettings['edgeDistances'],
                    'opacity': this.defaultEdgeClassSettings['opacity'],
                    'label': 'data(label)',
                    'edge-text-rotation': 'autorotate',
                    'curve-style': 'bezier'
                }
            };

            const nodeFadedSelector: Object = {
                selector: 'node.faded',
                style: {
                    'opacity': this.GRAPH_FADED_OPACITY,
                    'background-image-opacity': this.GRAPH_FADED_OPACITY,
                    'background-opacity': this.GRAPH_FADED_OPACITY,
                    'text-opacity': 0
                }
            };

            const edgeFadedSelector: Object = {
                selector: 'edge.faded',
                style: {
                    'opacity': this.GRAPH_FADED_OPACITY,
                    'background-image-opacity': this.GRAPH_FADED_OPACITY,
                    'background-opacity': this.GRAPH_FADED_OPACITY,
                    'text-opacity': 0
                }
            };

            const highlightedSelector: Object = {
                selector: '.highlighted',
                style: {
                    'border-width': 5,
                    'opacity': 1,
                    'background-color': '#61bffc',
                    'line-color': '#61bffc',
                    'target-arrow-color': '#61bffc',
                    'transition-property': 'background-color, line-color, target-arrow-color'
                }
            };

            const invisibleSelector: Object = {
                selector: '.invisible',
                style: {
                    'display': 'none'
                }
            };

            // edge handles' selector
            const handleSelector: Object = {
                selector: '.eh-handle',
                style: {
                    'background-color': 'red',
                    'width': 7,
                    'height': 7,
                    'shape': 'ellipse',
                    'overlay-opacity': 0,
                    'border-width': 5, // makes the handle easier to hit
                    'border-opacity': 0
                }
            };

            this.ngZone.runOutsideAngular(() => {

                this.cy = cytoscape({

                    container: cont,
                    // elements: this.graphElements,      // different entering layout animation

                    style: [
                        nodeSelector,
                        edgeSelector,
                        nodeFadedSelector,
                        edgeFadedSelector,
                        highlightedSelector,
                        invisibleSelector,
                        handleSelector
                    ],

                    zoom: 1,
                    pan: { x: 0, y: 0 },

                    minZoom: 0.1,
                    maxZoom: 10,
                    zoomingEnabled: true,
                    userZoomingEnabled: true,
                    panningEnabled: true,
                    userPanningEnabled: true,
                    boxSelectionEnabled: true,    // ORIGINAL WAS FALSE
                    selectionType: 'additive',      // ORIGINAL WAS 'single'
                    touchTapThreshold: 8,
                    desktopTapThreshold: 4,
                    autolock: false,
                    autoungrabify: false,
                    autounselectify: false,
                    layout: {
                        name: 'preset'
                    },

                    // rendering options:
                    headless: false,
                    styleEnabled: true,
                    hideEdgesOnViewport: true,  // ORIGINAL WAS FALSE
                    hideLabelsOnViewport: true,  // ORIGINAL WAS FALSE
                    textureOnViewport: false,
                    motionBlur: false,
                    motionBlurOpacity: 0.2,
                    wheelSensitivity: 1,
                    pixelRatio: 'auto'

                });

                this.nodesCanvasLayer = this.cy.cyCanvas({
                    zIndex: 1,
                    pixelRatio: 'auto'
                });
                this.nodesCanvas = this.nodesCanvasLayer.getCanvas();
                this.nodesCanvasContext = this.nodesCanvas.getContext('2d');
                this.textCanvas = this.nodesCanvasLayer.getCanvas();
                this.textContext = this.textCanvas.getContext('2d');

                // the default values of each option are outlined below:
            const cyEdgehandlesOptions = {
                preview: true, // whether to show added edges preview before releasing selection
                hoverDelay: 150, // time spent hovering over a target node before it is considered selected
                handleNodes: 'node', // selector/filter function for whether edges can be made from a given node
                snap: false, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
                snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
                snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
                noEdgeEventsInDraw: false, // set events:no to edges during draws, prevents mouseouts on compounds
                disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
                handlePosition: function(node) {
                    return 'middle top'; // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
                },
                handleInDrawMode: false, // whether to show the handle in draw mode
                edgeType: function(sourceNode, targetNode) {
                    // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
                    // returning null/undefined means an edge can't be added between the two nodes
                    return 'flat';
                },
                loopAllowed: function(node) {
                    // for the specified node, return whether edges from itself to itself are allowed
                    return false;
                },
                nodeLoopOffset: -50, // offset for edgeType: 'node' loops
                nodeParams: function(sourceNode, targetNode) {
                    // for edges between the specified source and target
                    // return element object to be passed to cy.add() for intermediary node
                    return {};
                },
                edgeParams: function(sourceNode, targetNode, i) {
                    // for edges between the specified source and target
                    // return element object to be passed to cy.add() for edge
                    // NB: i indicates edge index in case of edgeType: 'node'
                    return {};
                },
                ghostEdgeParams: function() {
                    // return element object to be passed to cy.add() for the ghost edge
                    // (default classes are always added for you)
                    return {};
                },
                start: function(sourceNode) {
                    // fired when edgehandles interaction starts (drag on handle)
                },
                complete: (sourceNode, targetNode, addedEles) => {
                    this.onAddEdgeAnimationComplete(sourceNode, targetNode, addedEles);
                },
                hoverover: function(sourceNode, targetNode) {
                    // fired when a target is hovered
                },
                drawon: function() {
                    // fired when draw mode enabled
                },
                drawoff: function() {
                    // fired when draw mode disabled
                }
            };

            this.cyEdgehandles = this.cy.edgehandles(cyEdgehandlesOptions);
            this.cyEdgehandles.disable();
            });

            this.cytoscapeInitialized = true;

            t = new Date();
            console.log('applyPanzoomEventsAndMenuToCytoscape: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');
            this.applyPanzoomToCytoscape();
            this.applyEventsToCytoscape();
            if (!this.minimizedView) {
                this.applyContextMenu();
            }
            t = new Date();
            console.log('applyPanzoomAndEventsToCytoscape: done (' + t + ', ms: ' + t.getMilliseconds() + ')\n');
        }

        // saving all the elements already present in the layout
        const alreadyPresentElements = this.cy.elements();
        alreadyPresentElements.lock(); // locking the already present elements

        // adding elements
        t = new Date();
        console.log('addElementsToGraph: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');

        if (traversing) {
            // filtering entering elements
            this.loadingNodes = this.loadingNodes.filter((newElem) => {
                const eles = this.cy.$('#' + newElem.data.id);
                if (eles.length === 1) {
                    // the elem is already present in the graph, then filter it out
                    return false;
                }
                return true;
            });
        }

        this.addLoadingElementsToGraph(selectEnteringNodes);
        t = new Date();
        console.log('addElementsToGraph: done (' + t + ', ms: ' + t.getMilliseconds() + ')\n');

        t = new Date();
        console.log('updateTimelineInput: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');
        this.updateTimelineInput();
        t = new Date();
        console.log('updateTimelineInput: done (' + t + ', ms: ' + t.getMilliseconds() + ')\n');

        // adding style class selectors
        t = new Date();
        console.log('addStyleClassSelectors: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');
        let styles = this.cy.style();
        this.addCandidateStyleClassSelectors(this.loadingStyleClassSelectors);
        styles = this.cy.style();
        t = new Date();
        console.log('addStyleClassSelectors: done (' + t + ', ms: ' + t.getMilliseconds() + ')\n');

        // update edges rendering and legend
        t = new Date();
        console.log('graphUpdateLegend: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');
        this.graphUpdateLegend();
        t = new Date();
        console.log('graphUpdateLegend: done (' + t + ', ms: ' + t.getMilliseconds() + ')\n');

        t = new Date();
        console.log('graphOptimizeEdgeClassStyle: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');
        this.graphOptimizeEdgeClassStyle();
        t = new Date();
        console.log('graphOptimizeEdgeClassStyle: done (' + t + ', ms: ' + t.getMilliseconds() + ')\n');

        // update filtering menu
        t = new Date();
        console.log('updateFilteringMenu: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');
        this.updateFilteringMenu().subscribe((filterMenuUpdateTriggered) => {

            // running the last layout after the faceting request (used to update the filtering menu) was triggered
            t = new Date();
            console.log('run Layout: starting (' + t + ', ms: ' + t.getMilliseconds() + ')');

            if (traversing) {
                alreadyPresentElements.unlock();
                // not needed a layout running, as entering nodes already have valid coordinates
                if (this.autoLayout) {
                    this.applyLastLayout();
                }
            } else {
                // we always need a layout running, as entering nodes don't have valid coordinates
                if (this.autoLayout) {
                    alreadyPresentElements.unlock();
                    this.applyLastLayout();
                } else {
                    /*
                    * Important: all the elements locked will be unlocked by the preset layout:
                    * - layout circle running
                    * - force layout
                    * - preset applying the coordinates computed by the force layout, then UNLOCK!
                    */
                    const options: Object = { traversing: true, runForceWhenReady: true };   // to avoid the last layout (force) overriding
                    this.graphApplyLayoutCircle(undefined, options);
                }
            }

            t = new Date();
            console.log('run Layout: done (' + t + ', ms: ' + t.getMilliseconds() + ')\n');
        });

        // updating to-save flag
        this.toSave = true;

        this.loadingNodesPositions = {};
    }

    applyPanzoomToCytoscape(snapshot?: Object) {

        // the default values of each option are outlined below:
        const panzoomOptions = {
            zoomFactor: 0.05, // zoom factor per zoom tick
            zoomDelay: 45, // how many ms between zoom ticks
            minZoom: 1e-3, // min zoom level
            maxZoom: 1e3, // max zoom level
            fitPadding: 50, // padding when fitting
            panSpeed: 10, // how many ms in between pan ticks
            panDistance: 10, // max pan distance per tick
            panDragAreaSize: 75, // the length of the pan drag box in which the vector for panning is calculated (bigger = finer control of pan speed and direction)
            panMinPercentSpeed: 0.25, // the slowest speed we can pan by (as a percent of panSpeed)
            panInactiveArea: 8, // radius of inactive area in pan drag box
            panIndicatorMinOpacity: 0.5, // min opacity of pan indicator (the draggable nib); scales from this to 1.0
            zoomOnly: false, // a minimal version of the ui only with zooming (useful on systems with bad mousewheel resolution)
            fitSelector: undefined, // selector of elements to fit
            animateOnFit: function() { // whether to animate on fit
                return false;
            },
            fitAnimationDuration: 1000, // duration of animation on fit

            // icon class names
            sliderHandleIcon: 'fa fa-minus',
            zoomInIcon: 'fa fa-plus',
            zoomOutIcon: 'fa fa-minus',
            resetIcon: 'fa fa-bullseye'
        };

        if (snapshot) {
            // override minzoom and maxzoom options
            panzoomOptions['minZoom'] = snapshot['minZoom'];
            panzoomOptions['maxZoom'] = snapshot['maxZoom'];
        }
        this.cy.panzoom(panzoomOptions);
    }

    applyEventsToCytoscape() {

        // TIMEOUTS
        let addTimeout;  // variable used to clear the timeout on elements adding
        let removeTimeout;  // variable used to clear the timeout on elements removing
        let selectionTimeout;  // variable used to clear the timeout on new selection
        let unselectionTimeout;  // variable used to clear the timeout on new selection

        // Events handling
        this.cy.on('tapstart', (event) => {
            const evtTarget = event.target;
            if (evtTarget === this.cy) {
                this.graphUnselectAll();
                if (this.contextMenuInstance) {
                    this.purgeContextMenuDynamicParts();
                }
            }
        });

        this.cy.on('add', 'node,edge', (event) => {

            if (this.contextMenuInstance && this.traverseSubmenuActivated) {
                const ctxMenuHidden = (<any>$('.cy-context-menus-cxt-menu:hidden')).get(0);
                if (ctxMenuHidden) {
                    this.removeTraverseSubmenu();
                }
            }

            const tableInputElements: Object[] = this.cy.elements().jsons();

            clearTimeout(addTimeout);
            this.ngZone.runOutsideAngular(() => {
                addTimeout = setTimeout(() => {
                    this.updateTableInputColumns();
                    this.updateTableInputElements(tableInputElements);

                    // traverse menu updating
                    this.updateTraverseMenu();
                }, 200);
            });
        });

        this.cy.on('remove', 'node,edge', (evt) => {

            if (this.contextMenuInstance && this.traverseSubmenuActivated) {
                const ctxMenuHidden = (<any>$('.cy-context-menus-cxt-menu:hidden')).get(0);
                if (ctxMenuHidden) {
                    this.removeTraverseSubmenu();
                }
            }

            const tableInputElements: Object[] = this.cy.elements().jsons();

            clearTimeout(removeTimeout);
            this.ngZone.runOutsideAngular(() => {
                removeTimeout = setTimeout(() => {
                    this.updateTableInputColumns();
                    this.updateTableInputElements(tableInputElements);

                    // traverse menu updating
                    this.updateTraverseMenu();
                }, 200);
            });
        });

        this.cy.on('select', 'node,edge', (evt) => {

            if (this.contextMenuInstance && this.traverseSubmenuActivated) {
                const ctxMenuHidden = (<any>$('.cy-context-menus-cxt-menu:hidden')).get(0);
                if (ctxMenuHidden) {
                    this.removeTraverseSubmenu();
                }
            }

            clearTimeout(selectionTimeout);
            this.ngZone.runOutsideAngular(() => {
                selectionTimeout = setTimeout(() => {
                    const element = evt.target;
                    this.updateCurrentSelectionStatus([element]);

                    // if the selecting element is a node we have to check if the shortest path
                    if (element.isNode()) {
                        if (this.shortestPathSelectingNode) {
                            const selectedNode = evt.target;
                            const selectedNodeClass = selectedNode.json()['data']['class'];
                            if (this.shortestPathSelectingNode === 'from') {
                                this.shortestPathSourceNode = selectedNode;
                                this.shortestPathSourceNodeInputLabel = this.getShortestPathNodeLabelFromNode(selectedNode, selectedNodeClass);
                            } else if (this.shortestPathSelectingNode === 'to') {
                                this.shortestPathTargetNode = selectedNode;
                                this.shortestPathTargetNodeInputLabel = this.getShortestPathNodeLabelFromNode(selectedNode, selectedNodeClass);
                            }
                        }
                    }
                }, 200);
            });
        });

        // draw nodes' degree
        this.cy.on('render cyCanvas.resize', (evt) => {
            this.updateNodesDegreeCanvasAccordingFlag();
        });

        // shortest path node selection
        this.cy.on('select', 'node', (evt) => {

        });

        this.cy.on('grab', 'node,edge', (evt) => {

            // hiding context menu
            if (this.contextMenuInstance) {
                this.manuallyHideAndCleanContextMenu();
            }
        });

        this.cy.on('unselect', 'node,edge', (evt) => {

            // removing traverse submenu if any
            if (this.contextMenuInstance && this.traverseSubmenuActivated) {
                this.removeTraverseSubmenu();
            }

            clearTimeout(unselectionTimeout);
            this.ngZone.runOutsideAngular(() => {
                unselectionTimeout = setTimeout(() => {
                    const node = evt.target;
                    console.log('Unselected ' + this.widgetId + '-' + 'vertex' + '-' + node.id());
                    this.updateCurrentSelectionStatus([]);
                }, 200);
            });
        });

        // used to select the node at the right click, when the context menu is opened
        this.cy.on('cxttap', 'node,edge', (evt) => {

            // cleaning context menu if dirty (case: right click on a node followed by another right click on a second node)
            if (this.contextMenuInstance) {
                this.purgeContextMenuDynamicParts();
            }

            clearTimeout(selectionTimeout);
            this.ngZone.runOutsideAngular(() => {
                selectionTimeout = setTimeout(() => {
                    const element = evt.target;
                    if (this.contextMenuInstance) {
                        this.addDynamicMenuItemToContextMenu(element.json());
                    }
                    console.log('Selected ' + this.widgetId + '-' + 'vertex' + '-' + element.id());
                    this.updateCurrentSelectionStatus([element]);
                    element.select();
                }, 50);
            });
        });

        this.cy.on('style', 'node,edge', (evt) => {
            const node = evt.target.json();

            if (this.showContextCommandRunning) {

                // remove current show-hide item form the context menu
                this.contextMenuInstance.removeMenuItem('show-hide');

                this.addShowHideItemToContextMenu(node);
                this.showContextCommandRunning = false;
            } else if (this.hideContextCommandRunning) {

                // remove current show-hide item form the context menu
                this.contextMenuInstance.removeMenuItem('show-hide');

                this.addShowHideItemToContextMenu(node);
                this.hideContextCommandRunning = false;
            }
        });
    }

    updateNodesDegreeCanvasAccordingFlag() {

        // clearing old canvas (always performed!)
        this.nodesCanvasLayer.resetTransform(this.nodesCanvasContext);
        this.nodesCanvasLayer.clear(this.nodesCanvasContext);

        if (this.nodesDegreeCanvasEnabled) {

            this.nodesCanvasLayer.setTransform(this.nodesCanvasContext);

            // Draw model elements
            this.cy.nodes().forEach((node) => {
                const nodeData = node.data();

                if (nodeData['class'] && nodeData['type'] && nodeData['record']) {
                    const nodePos = node.position();
                    const nodeWidth = node.width();
                    const nodeRadius = nodeWidth / 2;
                    const positioningAngle = -60;

                    // drawing container cardinality circle
                    this.nodesCanvasContext.beginPath();
                    const cardinalityCircleXCenter = nodePos.x - nodeRadius * Math.cos(positioningAngle);
                    const cardinalityCircleYCenter = nodePos.y - nodeRadius * Math.sin(positioningAngle);
                    this.nodesCanvasContext.arc(cardinalityCircleXCenter, cardinalityCircleYCenter, this.cardinalityCircleRadius, 0, 2 * Math.PI);
                    this.nodesCanvasContext.fillStyle = node.style('background-color');
                    this.nodesCanvasContext.fill();
                    // this.nodesCanvasContext.strokeStyle = node.style('line-color');
                    // this.nodesCanvasContext.stroke();

                    // drawing cardinality text
                    const nodesCardinality = node.data()['edgeCount'];
                    const fontFace = node.style('font-family');
                    let fontSize = 10;
                    this.textContext.fillStyle = 'white';
                    this.textContext.textAlign = 'center';
                    this.textContext.textBaseline = 'middle';
                    this.textContext.font = fontSize + 'px ' + fontFace;

                    // adapting the font size to the cardinality circle width
                    const cardinalityCircleWidth = this.cardinalityCircleRadius * 2;
                    while (this.textContext.measureText(nodesCardinality).width > cardinalityCircleWidth) {
                        fontSize--;
                        this.textContext.font = fontSize + 'px ' + fontFace;
                    }

                    this.textContext.fillStyle = 'white';
                    this.textContext.textAlign = 'center';
                    this.textContext.textBaseline = 'middle';
                    this.textContext.font = fontSize + 'px ' + fontFace;
                    this.textContext.fillText(nodesCardinality, cardinalityCircleXCenter, cardinalityCircleYCenter);
                }
            });
        }
    }

    getShortestPathNodeLabelFromNode(node, nodeClass: string) {
        return '#' + node.id() + ' (' + nodeClass + ')';
    }

    applyContextMenu() {

        // context menu settings
        const options = {
            menuItems: [
                {
                    id: 'delete',
                    content:
                        `<span>
                                <span class="context-menu-item-icon fa fa-trash"/> Delete
                            </span>`,
                    tooltipText: 'Delete',
                    selector: 'node,edge',
                    onClickFunction: (event) => {
                        const node = event.target.json();
                        this.graphDeleteElementById(node['data']['id']);
                    },
                    hasTrailingDivider: false
                },
                {
                    id: 'add-edge',
                    content:
                        `<span>
                                <span class="context-menu-item-icon fa fa-long-arrow-right"/> Add Edge
                            </span>`,
                    tooltipText: 'Add Edge',
                    selector: 'node',
                    onClickFunction: () => {
                        this.enableCyEdgeHandles();
                    },
                    hasTrailingDivider: false
                },
                {
                    id: 'hidden-footer-item',
                    content:
                        `<span>
                                Hidden Footer
                            </span>`,
                    selector: 'node,edge',
                    onClickFunction: (event) => {
                        // DO NOTHING
                    },
                    hasTrailingDivider: false
                }
            ],
            // css classes that menu items will have
            menuItemClasses: [
                // add class names to this list
            ],
            // css classes that context menu will have
            contextMenuClasses: [
                // add class names to this list
            ]
        };

        this.contextMenuInstance = this.cy.contextMenus(options);

        // adding unique id ti the context menu
        (<any>$('.cy-context-menus-cxt-menu')).attr('id', 'graph-widget-context-menu');

        // applying custom styles
        (<any>$('#graph-widget-context-menu')).css('border-radius', '4px');

        // hiding footer menu item
        this.contextMenuInstance.hideMenuItem('hidden-footer-item');

        // adding view content menu item
        this.addViewContentItemToContextMenu();

        // adding shortest path menu item
        this.addShortestPathItemsToContextMenu();

        // adding traverse menu item
        this.addTraverseItemToContextMenu();
    }

    applyQtipToElements(elements?) {
        let targetElements = elements;
        if (!targetElements) {
            targetElements = this.cy.elements();
        }
        targetElements.forEach(function(ele) {

            ele.qtip({
                content: {
                    text: this.getQtipPropertiesTemplate(ele),
                    title: (ele.data('type') === 'v' ? 'Vertex' : 'Edge') +
                        (' <b>#' + ele.data('id').replace('_', ':'))
                        + '</b> Class: <b>' + ele.data().record['@class'] + '</b>'
                },
                style: {
                    classes: 'qtip-bootstrap'
                },
                show: {
                    event: 'mouseover',
                    delay: 500
                },
                hide: {
                    event: 'mouseout',
                    delay: 200
                },
                position: {
                    my: 'left center',
                    at: 'right center',
                    target: ele
                }
            });
        });
    }

    // auxiliary function
    getQtipPropertiesTemplate(node) {
        let template = '<table width=\'100%\'>';
        template += '<tr><td><b>Property</b></td><td><b>Value</b></td></tr>';
        const nodeData = node.data();
        const record = nodeData.record;
        template += '<tr><td>Id</td><td>' + nodeData['id'] + '</td></tr>';
        template += '<tr><td>Class</td><td>' + nodeData['classes'] + '</td></tr>';

        for (const currentProperty in record) {
            if (currentProperty !== '@id' && currentProperty !== '@class') {
                template += '<tr><td>' + currentProperty + '</td><td>' + record[currentProperty] + '</td></tr>';
            }
        }
        template += '</table>';
        return template;
    }

    /**
     * It adds nodes and edges style classes to the instance variables
     * from the datasource metadata.
     */
    udateCyMetadataFromCurrDatasourceMetadata() {

        this.totalVertices = 0;
        this.totalEdges = 0;

        // node classes
        for (const nodeClassName of Object.keys(this.dataSourceMetadata['nodesClasses'])) {
            if (!this.nodeClassesStyles.has(nodeClassName)) {
                const currentClassColor = this.generateNewColor();
                const currentClass = {
                    color: currentClassColor,
                    count: 0,
                    selected: 0,
                    settings: {
                        fieldLabel: this.defaultNodeClassSettings['fieldLabel'],
                        fieldWeight: this.defaultNodeClassSettings['fieldWeight'],
                        sizePolicy: this.defaultNodeClassSettings['sizePolicy'],
                        labelFontFamily: this.defaultNodeClassSettings['labelFontFamily'],
                        labelFontSize: this.defaultNodeClassSettings['labelFontSize'],
                        labelColor: this.defaultNodeClassSettings['labelColor'],
                        labelVPosition: this.defaultNodeClassSettings['labelVPosition'],
                        labelHPosition: this.defaultNodeClassSettings['labelHPosition'],
                        shapeWidth: this.defaultNodeClassSettings['shapeWidth'],
                        shapeHeight: this.defaultNodeClassSettings['shapeHeight'],
                        shapeImage: this.defaultNodeClassSettings['shapeImage'],
                        shapeColor: currentClassColor,
                        borderWidth: this.defaultNodeClassSettings['borderWidth'],
                        borderColor: this.defaultNodeClassSettings['borderColor']
                    }
                };
                this.nodeClassesStyles.set(nodeClassName, currentClass);
                this.nodeClassesNames.push(nodeClassName);
            }
            this.totalVertices += this.dataSourceMetadata['nodesClasses'][nodeClassName]['cardinality'];
        }

        // edge classes
        for (const edgeClassName of Object.keys(this.dataSourceMetadata['edgesClasses'])) {
            if (!this.edgeClassesStyles.has(edgeClassName)) {
                const currentClassColor = '#cdcdcd';        // by default all edge classes are grey
                const currentClass = {
                    color: currentClassColor,
                    count: 0,
                    selected: 0,
                    settings: {
                        fieldLabel: this.defaultEdgeClassSettings['fieldLabel'],
                        fieldWeight: this.defaultEdgeClassSettings['fieldWeight'],
                        sizePolicy: this.defaultEdgeClassSettings['sizePolicy'],
                        labelFontFamily: this.defaultEdgeClassSettings['labelFontFamily'],
                        labelFontSize: this.defaultEdgeClassSettings['labelFontSize'],
                        labelColor: this.defaultEdgeClassSettings['labelColor'],
                        sourceArrowColor: this.defaultEdgeClassSettings['sourceArrowColor'],
                        sourceArrowShape: this.defaultEdgeClassSettings['sourceArrowShape'],
                        targetArrowColor: currentClassColor,
                        targetArrowShape: this.defaultEdgeClassSettings['targetArrowShape'],
                        lineStyle: this.defaultEdgeClassSettings['lineStyle'],
                        lineColor: currentClassColor,
                        lineWidth: this.defaultEdgeClassSettings['lineWidth']
                    }
                };
                this.edgeClassesStyles.set(edgeClassName, currentClass);
                this.edgeClassesNames.push(edgeClassName);
            }
            this.totalEdges += this.dataSourceMetadata['edgesClasses'][edgeClassName]['cardinality'];
        }
    }

    addNodeClassMetadata(nodeClassName: string, metadata: Object) {
        this.dataSourceMetadata['nodesClasses'][nodeClassName] = metadata;
    }

    addEdgeClassMetadata(edgeClassName: string, metadata: Object) {
        this.dataSourceMetadata['edgesClasses'][edgeClassName] = metadata;
    }

    /**
     * It updates datasource metadata starting from the data retrieved through:
     * - query
     * - traverse
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
                // check for new entering node class properties
                for (const currProperty of Object.keys(currNodeClassMetadata)) {
                    if (!this.dataSourceMetadata['nodesClasses'][nodeClassName]['properties'][currProperty]) {
                        // add the new property metadata
                        const newEnteringPropertyMetadata = {
                            name: currProperty,
                            type: currNodeClassMetadata[currProperty]
                        };
                        this.dataSourceMetadata['nodesClasses'][nodeClassName]['properties'][currProperty] = newEnteringPropertyMetadata;
                    }
                }
            }
        }

        // updating edge class properties with the new entering edges just loaded
        for (const edgeClassName of Object.keys(data['edgesClasses'])) {
            const currEdgeClassMetadata = data['edgesClasses'][edgeClassName];
            if (!this.dataSourceMetadata['edgesClasses'][edgeClassName]) {
                // add the new entering node class

                if (!currEdgeClassMetadata['name']) {
                    currEdgeClassMetadata['name'] = edgeClassName;
                }
                if (!currEdgeClassMetadata['cardinality']) {
                    currEdgeClassMetadata['cardinality'] = 0;
                }
                if (!currEdgeClassMetadata['properties']) {
                    currEdgeClassMetadata['properties'] = {};
                }
                this.addEdgeClassMetadata(edgeClassName, edgeClassName);
            } else {
                // check for new entering node class properties
                for (const currProperty of Object.keys(currEdgeClassMetadata)) {
                    if (!this.dataSourceMetadata['edgesClasses'][edgeClassName]['properties'][currProperty]) {
                        // add the new property metadata
                        const newEnteringPropertyMetadata = {
                            name: currProperty,
                            type: currEdgeClassMetadata[currProperty]
                        };
                        this.dataSourceMetadata['edgesClasses'][edgeClassName]['properties'][currProperty] = newEnteringPropertyMetadata;
                    }
                }
            }
        }
    }

    /**
     * It adds data elements (single vertices and edges)
     * to the instance variables if not present yet.
     * @param data
     */
    updateCytoscapeData(data) {

        /*
         * Elements
         */

        if (!this.minimizedView) {
            if (!this.newTimelineInputClass) {
                this.newTimelineInputClass = this.nodeClassesNames[0];
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        this.updateTimelineClassProperties();
                    }, 1000);
                });
            }
        }

        let graphElementsIndex: number = 0;

        // nodes init
        for (const node of data.nodes) {
            this.nodesNumber++;

            const className: string = node['classes'].split(' ')[0];

            if (node.position === undefined) {
                node.position = { x: 0, y: 0 };
            }

            this.loadingNodes.push({
                group: 'nodes',
                data: {
                    id: node.data.id,
                    type: 'v',
                    class: className,
                    edgeCount: node['data']['record']['@edgeCount'],
                    record: node.data.record
                },
                selected: false, // whether the element is selected (default false)
                selectable: true, // whether the selection state is mutable (default true)
                locked: false, // when locked a node's position is immutable (default false)
                grabbable: true, // whether the node can be grabbed and moved by the user
                classes: node['classes'],
                position: {
                    x: node.position.x,
                    y: node.position.y
                }
            });

            this.loadingNodesPositions[node.data.id] = {
                x: node.position.x,
                y: node.position.y
            };

            graphElementsIndex++;
        }

        // edges init
        for (const edge of data.edges) {

            const className: string = edge['classes'].split(' ')[0];

            this.loadingEdges.push({
                group: 'edges',
                data: {
                    id: edge.data.id,
                    source: edge.data.source,
                    target: edge.data.target,
                    class: className,
                    type: 'e',
                    record: edge.data.record
                },
                selected: false, // whether the element is selected (default false)
                selectable: true, // whether the selection state is mutable (default true)
                locked: false, // when locked a node's position is immutable (default false)
                grabbable: true, // whether the node can be grabbed and moved by the user
                classes: edge['classes'] // a space separated list of class names that the element has
            });
            graphElementsIndex++;
        }

        /*
        * Styles
        */

        const nodesClassesSelector: Object[] = [];
        let i = 0;
        for (const nodeClassName of this.nodeClassesNames) {
            nodesClassesSelector[i] = {
                selector: 'node.' + this.escapeSelector(nodeClassName),
                style: {}
            };
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelFontFamily']) {
                (<any>nodesClassesSelector[i]).style['font-family'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelFontFamily'];
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelFontSize']) {
                (<any>nodesClassesSelector[i]).style['font-size'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelFontSize'];
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelColor']) {
                (<any>nodesClassesSelector[i]).style['color'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelColor'];
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['fieldLabel']) {
                if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['fieldLabel'] === 'id' ||
                    this.getNodeStyleClassByClassName(nodeClassName)['settings']['fieldLabel'] === 'class') {
                    (<any>nodesClassesSelector[i]).style['label'] = 'data(' + this.getNodeStyleClassByClassName(nodeClassName)['settings']['fieldLabel'] + ')';
                } else {
                    (<any>nodesClassesSelector[i]).style['label'] = 'data(record.' + this.getNodeStyleClassByClassName(nodeClassName)['settings']['fieldLabel'] + ')';
                }
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelVPosition']) {
                (<any>nodesClassesSelector[i]).style['text-valign'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelVPosition'];
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelHPosition']) {
                (<any>nodesClassesSelector[i]).style['text-halign'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['labelHPosition'];
            }
            // if (this.nodeClasses.get(nodeClassName).settings.fieldWeight && this.nodeClasses.get(nodeClassName).settings.sizePolicy === 'weight') {
            //     (<any>nodesClassesSelector[i]).style['width'] = 'data(record.' + this.nodeClasses.get(nodeClassName).settings.fieldWeight +')';
            //     (<any>nodesClassesSelector[i]).style['height'] = 'data(record.' + this.nodeClasses.get(nodeClassName).settings.fieldWeight +')';
            // }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['shapeWidth']) {
                (<any>nodesClassesSelector[i]).style['width'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['shapeWidth'];
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['shapeHeight']) {
                (<any>nodesClassesSelector[i]).style['height'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['shapeHeight'];
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['shapeColor']) {
                (<any>nodesClassesSelector[i]).style['background-color'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['shapeColor'];
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['shapeImage']) {
                (<any>nodesClassesSelector[i]).style['background-fit'] = 'none';
                (<any>nodesClassesSelector[i]).style['background-width'] = '70%';
                (<any>nodesClassesSelector[i]).style['background-heigth'] = '70%';
                (<any>nodesClassesSelector[i]).style['background-image'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['shapeImage'];
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['borderWidth']) {
                (<any>nodesClassesSelector[i]).style['border-width'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['borderWidth'];
            }
            if (this.getNodeStyleClassByClassName(nodeClassName)['settings']['borderColor']) {
                (<any>nodesClassesSelector[i]).style['border-color'] = this.getNodeStyleClassByClassName(nodeClassName)['settings']['borderColor'];
            }

            i++;
        }

        const edgeClassesSelector: Object[] = [];
        i = 0;
        for (const edgeClassName of this.edgeClassesNames) {
            edgeClassesSelector[i] = {
                selector: 'edge.' + this.escapeSelector(edgeClassName),
                style: {}
            };
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['labelFontFamily']) {
                (<any>edgeClassesSelector[i]).style['font-family'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['labelFontFamily'];
            }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['labelFontSize']) {
                (<any>edgeClassesSelector[i]).style['font-size'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['labelFontSize'];
            }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['labelColor']) {
                (<any>edgeClassesSelector[i]).style['color'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['labelColor'];
            }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['fieldLabel'] !== undefined) {
                if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['fieldLabel'] === 'id' ||
                    this.getEdgeStyleClassByClassName(edgeClassName)['settings']['fieldLabel'] === 'class') {
                    (<any>edgeClassesSelector[i]).style['label'] = 'data(' + this.getEdgeStyleClassByClassName(edgeClassName)['settings']['fieldLabel'] + ')';
                } else if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['fieldLabel'] === '') {
                    (<any>edgeClassesSelector[i]).style['label'] = '';
                } else {
                    (<any>edgeClassesSelector[i]).style['label'] = 'data(record.' + this.getEdgeStyleClassByClassName(edgeClassName)['settings']['fieldLabel'] + ')';
                }
            }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['sourceArrowShape']) {
                (<any>edgeClassesSelector[i]).style['source-arrow-shape'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['sourceArrowShape'];
            }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['sourceArrowColor']) {
                (<any>edgeClassesSelector[i]).style['source-arrow-color'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['sourceArrowColor'];
            }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['targetArrowShape']) {
                (<any>edgeClassesSelector[i]).style['target-arrow-shape'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['targetArrowShape'];
            }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['targetArrowColor']) {
                (<any>edgeClassesSelector[i]).style['target-arrow-color'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['targetArrowColor'];
            }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['lineStyle']) {
                (<any>edgeClassesSelector[i]).style['line-style'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['lineStyle'];
            }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['lineColor']) {
                (<any>edgeClassesSelector[i]).style['line-color'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['lineColor'];
            }
            // if (this.edgeClasses.get(edgeClassName).settings.lineWidth && this.edgeClasses.get(edgeClassName).settings.sizePolicy === 'weight') {
            //     (<any>edgeClassesSelector[i]).style['width'] = 'data(record.' + this.edgeClasses.get(edgeClassName).settings.fieldWeight +')';
            // }
            if (this.getEdgeStyleClassByClassName(edgeClassName)['settings']['lineWidth']) {
                (<any>edgeClassesSelector[i]).style['width'] = this.getEdgeStyleClassByClassName(edgeClassName)['settings']['lineWidth'];
            }
            i++;
        }

        const nodeSelectedSelector: Object[] = [];
        nodeSelectedSelector[0] = {
            selector: 'node:selected',
            style: {
                'border-width': 5,
                'border-color': 'red'
            }
        };

        const edgeClassesSelectedSelector: Object[] = [];
        edgeClassesSelectedSelector[0] = {
            selector: 'edge:selected',
            style: {
                'overlay-padding': '6px',
                'overlay-opacity': 0.3,
                'overlay-color': 'red'
            }
        };

        // handles selectors
        const handleSourceSelector: Object = {
            selector: '.eh-source',
            style: {
                'border-width': 5,
                'border-color': this.edgeHandlesColor
            }
        };
        const handleTargetSelector: Object = {
            selector: '.eh-target',
            style: {
                'border-width': 5,
                'border-color': this.edgeHandlesColor
            }
        };
        const handlePreviewSelector: Object = {
            selector: '.eh-preview, .eh-ghost-edge',
            style: {
                // 'background-color': this.edgeHandlesColor,
                'line-color': this.edgeHandlesColor,
                'target-arrow-color': this.edgeHandlesColor,
                'source-arrow-color': this.edgeHandlesColor
            }
        };
        const handlePreviewActiveSelector: Object = {
            selector: '.eh-ghost-edge.eh-preview-active',
            style: {
                'opacity': 0
            }
        };

        this.loadingStyleClassSelectors = [...nodesClassesSelector,
            ...edgeClassesSelector,
            ...edgeClassesSelectedSelector,
            ...nodeSelectedSelector,
            handleSourceSelector,
            handleTargetSelector,
            handlePreviewSelector,
            handlePreviewActiveSelector];
    }

    getNodeStyleClassByClassName(nodeClassName: string): Object {

        if (!this.nodeClassesStyles.has(nodeClassName)) {
            // try to take off all the '\'
            nodeClassName = nodeClassName.replace(/\\/g, '');
        }
        return this.nodeClassesStyles.get(nodeClassName);
    }

    getEdgeStyleClassByClassName(edgeClassName: string): Object {

        if (!this.edgeClassesStyles.has(edgeClassName)) {
            // try to take off all the '\'
            edgeClassName = edgeClassName.replace(/\\/g, '');
        }
        return this.edgeClassesStyles.get(edgeClassName);
    }

    getClassStyleOfLastSelectedElement(className: string): Object {

        let selector;
        if (this.lastSelectedElement['data']['type'] === 'v') {
            selector = 'node.' + this.escapeSelector(className);
        } else {
            selector = 'edge.' + this.escapeSelector(className);
        }
        return this.getStyleClassFromSelector(selector);
    }

    getStyleClassFromSelector(selector: string) {

        const styleClassSelectors = this.getCytoscapeStyleClasses();
        for (const currentStyle of styleClassSelectors) {
            if (currentStyle['selector'] === selector) {
                return currentStyle;
            }
        }
        return undefined;
    }

    getClassInfoFromSelector(selector: string) {
        let classType: string;
        let className: string;
        if (selector.indexOf('node.') >= 0) {
            classType = 'node';
            className = selector.substring(selector.indexOf('node.') + 5);
        } else if (selector.indexOf('edge.') >= 0) {
            classType = 'edge';
            className = selector.substring(selector.indexOf('edge.') + 5);
        }
        if (className.indexOf(':selected') >= 0) {
            className = className.replace(':selected', '');
        }
        const classInfo = {
            type: classType,
            name: className,
            selector: selector
        };
        return classInfo;
    }

    removeClassStyle(selector: string) {

        const styleClassSelectors = this.getCytoscapeStyleClasses();

        // adding the new elements to the current set of styles
        let index = 0;
        for (const currentStyle of styleClassSelectors) {
            if (currentStyle['selector'] === selector) {
                styleClassSelectors.splice(index, 1);
            }
            index++;
        }
    }

    updateStyleClass() {

        const selector = this.classStyleOfLastSelectedElement['selector'];
        const style = this.classStyleOfLastSelectedElement['style'];
        const styleClass = {
            selector: selector,
            style: style
        };
        let styleClassSelectors = this.getCytoscapeStyleClasses();

        const classInfo: Object = this.getClassInfoFromSelector(selector);
        const classType: string = classInfo['type'];
        const className: string = this.classNameOfLastSelectedElement;

        // updating the target class style
        let index = 0;
        for (const currentStyle of styleClassSelectors) {
            if (currentStyle['selector'] === selector) {
                // swapping the target class style
                styleClassSelectors.splice(index, 1, styleClass);
            } else {
                // cy bug fix (percentage omitted): updating background fields if present with percentage values
                if (currentStyle['style']['background-width'] && currentStyle['style']['background-height']) {
                    currentStyle['style']['background-width'] = '70%';
                    currentStyle['style']['background-height'] = '70%';
                }
            }
            index++;
        }

        // style: updating mapData fields if 'weight' field is present in the style
        let linearSizeActive: boolean = false;
        if (style['width'].indexOf('mapData') >= 0) {
            this.prepareMapDataFunction(style, selector);
            linearSizeActive = true;
        }

        // updating correspondent edge:selected class to update overlay effect for selection
        if (classType === 'edge') {
            const selector2 = 'edge:selected.' + selector.replace('edge.', '');

            // updating the target class style
            for (const currentStyle of styleClassSelectors) {
                if (currentStyle['selector'] === selector2) {
                    // updating the target class style
                    // currentStyle['style']['overlay-color'] = styleClass['style']['line-color'];    // overlay color is always red now!
                    const refWidth = styleClass['style']['width'];
                    let widthValue;
                    if (refWidth.indexOf('mapData') >= 0) {
                        widthValue = refWidth.replace('mapData(', '').replace(')', '');
                        const args = widthValue.split(', ');
                        currentStyle['style']['overlay-padding'] = (elem) => {
                            const currElemInfo = elem.json();
                            const field = args[0].replace('record.', '');
                            const min1 = parseInt(args[1], 10);
                            const max1 = parseInt(args[2], 10);
                            const min2 = parseInt(args[3], 10);
                            const max2 = parseInt(args[4], 10);
                            let fieldValue = currElemInfo['data']['record'][field];
                            fieldValue = fieldValue - min1;
                            let width = (fieldValue * (max2 - min2)) / (max1 - min1);
                            width = width + min2;

                            // add constant padding
                            const padding: number = this.getCorrespondentPadding(width);
                            width = width + padding;
                            return width;
                        };
                    } else {
                        widthValue = parseInt(refWidth, 10);
                        const padding: number = this.getCorrespondentPadding(widthValue);
                        currentStyle['style']['overlay-padding'] = widthValue + padding;
                    }
                    break;
                }
            }
        }

        // setting the new styles' set
        this.cy.style()
            .fromJson(styleClassSelectors)
            .update(); // update the elements in the graph with the new style

        styleClassSelectors = this.getCytoscapeStyleClasses();

        if (classType === 'node') {
            const label = this.extractField(style['label']);
            const classStyle = {
                color: style['background-color'],
                count: this.getNodeStyleClassByClassName(className)['count'],
                hidden: this.getNodeStyleClassByClassName(className)['hidden'],
                selected: this.getNodeStyleClassByClassName(className)['selected'],
                settings: {
                    labelFontFamily: style['font-family'],
                    labelFontSize: style['font-size'],
                    labelColor: style['color'],
                    fieldLabel: label,
                    // fieldWeight: weight,
                    labelVPosition: style['text-valign'],
                    labelHPosition: style['text-halign'],
                    shapeWidth: style['width'],
                    shapeHeight: style['height'],
                    shapeColor: style['background-color'],
                    shapeImage: style['background-image'],
                    borderWidth: style['border-width'],
                    borderColor: style['border-color']
                }
            };
            this.nodeClassesStyles.delete(className);
            this.nodeClassesStyles.set(className, classStyle);
        } else if (classType === 'edge') {
            const label = this.extractField(style['label']);
            const classStyle = {
                color: style['line-color'],
                count: this.getEdgeStyleClassByClassName(className)['count'],
                hidden: this.getEdgeStyleClassByClassName(className)['hidden'],
                selected: this.getEdgeStyleClassByClassName(className)['selected'],
                settings: {
                    labelFontFamily: style['font-family'],
                    labelFontSize: style['font-size'],
                    labelColor: style['color'],
                    fieldLabel: label,
                    // fieldWeight: weight,
                    sourceArrowShape: style['source-arrow-shape'],
                    sourceArrowColor: style['source-arrow-color'],
                    targetArrowShape: style['target-arrow-shape'],
                    targetArrowColor: style['target-arrow-color'],
                    lineStyle: style['line-style'],
                    lineColor: style['line-color'],
                    lineWidth: style['width']
                }
            };
            this.edgeClassesStyles.delete(className);
            this.edgeClassesStyles.set(className, classStyle);
        }

        // updating to-save flag
        this.toSave = true;
    }

    updateCytoscapeStyleClassApplying() {
        this.cy.style().update();
    }

    getCytoscapeStyleClasses(): Object[] {
        const styleClassSelectors = this.cy.style().json();
        for (const styleClassSelector of styleClassSelectors) {
            if (styleClassSelector['selector'].startsWith('node.') && styleClassSelector['selector'] !== 'node.faded') {
                const className = styleClassSelector['selector'].replace('node.', '');
                const escapedSelector = 'node.' + this.escapeSelector(className);
                styleClassSelector['selector'] = escapedSelector;
            } else if (styleClassSelector['selector'].startsWith('edge.', '') && styleClassSelector['selector'] !== 'edge.faded') {
                const className = styleClassSelector['selector'].replace('edge.', '');
                const escapedSelector = 'edge.' + this.escapeSelector(className);
                styleClassSelector['selector'] = escapedSelector;
            }
        }
        return styleClassSelectors;
    }

    escapeSelector(inputString: string): string {
        inputString = inputString.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\\$&');
        return inputString;
    }

    // Auxiliary functions
    getCorrespondentPadding(width: number) {
        let padding: number;

        if (1 <= width && width < 3) {
            padding = 6;
        } else if (3 <= width && width < 5) {
            padding = 7;
        } else if (5 <= width && width < 6) {
            padding = 8;
        } else if (6 <= width && width < 8) {
            padding = 9;
        } else if (8 <= width && width <= 10) {
            padding = 10;
        }
        return padding;
    }

    extractField(labelStyleField) {
        const label = labelStyleField.replace('data(', '')
            .replace('record.', '')
            .replace(')', '');
        return label;
    }

    /**
     * It computes the mapData function and coherently updates the style class passed as param.
     * @param style
     * @param selector
     */
    prepareMapDataFunction(style: Object, selector: string) {

        let mapDataExpression = style['width'];

        const splits = mapDataExpression.split('mapData(');
        splits.splice(0, 1);
        const expression = splits[0];     // (fieldName, minValue, maxValue, mappedMinValue, mappedMaxValue)
        const exprArgs = expression.split(',');

        // field name
        let fieldName = exprArgs[0];
        let isRecordField: boolean = true;
        if (fieldName === 'record.@edgeCount' || fieldName === 'edgeCount') {         // if fieldName is record.@edgeCount is not a record field actually
            isRecordField = false;
        }

        // delete 'record.' prefix in order to join both the 2 main cases:
        // - weight field is a record field
        // - weight field is 'edgeCount'
        if (fieldName.indexOf('record.') >= 0) {
            fieldName = fieldName.replace('record.', '');
        }
        if (fieldName.indexOf('@') >= 0) {
            fieldName = fieldName.replace('@', '');   // deleting @ char for reserved fields
        }

        // setting minValue and maxValue
        let min = this.getMinFieldValueForClass(selector, fieldName, isRecordField);     // minValue
        const max = this.getMaxFieldValueForClass(selector, fieldName, isRecordField);     // maxValue

        exprArgs[0] = fieldName;

        // range for cy mapData(..) function cannot be empty, so we decrease min value (also negative?)
        // then when maximum and minimum are equal, the nodes all have the same dimension: the upper bound linear size
        if (min === max) {
            min--;
        }
        exprArgs[1] = ' ' + min;
        exprArgs[2] = ' ' + max;

        // adding again prefixes
        if (fieldName === 'edgeCount') {
            // exprArgs[0] = fieldName.substring(1);
            mapDataExpression = 'mapData(' + exprArgs.join();
        } else {
            mapDataExpression = 'mapData(record.' + exprArgs.join();
        }

        if (selector.startsWith('node.')) {
            style['width'] = mapDataExpression;
            style['height'] = mapDataExpression;
        } else if (selector.startsWith('edge.')) {
            style['width'] = mapDataExpression;
        }
    }

    getMinFieldValueForClass(selector: string, fieldName: string, isRecordField: boolean) {

        const elements = this.cy.$(selector);
        let min: number;
        if (elements.length > 0) {
            const elemData = elements[0].data();
            if (isRecordField) {
                min = elemData['record'][fieldName];
            } else {
                min = elemData[fieldName];
            }
        } else {
            console.error('Error: no elements are present with \'' + selector + '\' selector.');
        }
        for (const currElem of elements) {
            const elemData = currElem.data();
            if (isRecordField) {
                if (elemData['record'][fieldName] < min) {
                    min = currElem.data()['record'][fieldName];
                }
            } else {
                if (elemData[fieldName] < min) {
                    min = currElem.data()[fieldName];
                }
            }
        }
        return min;
    }

    getMaxFieldValueForClass(selector: string, fieldName: string, isRecordField: boolean) {

        const elements = this.cy.$(selector);
        let max: number;
        if (elements.length > 0) {
            const elemData = elements[0].data();
            if (isRecordField) {
                max = elemData['record'][fieldName];
            } else {
                max = elemData[fieldName];
            }
        } else {
            console.error('Error: no elements are present with \'' + selector + '\' selector.');
        }
        for (const currElem of elements) {
            const elemData = currElem.data();
            if (isRecordField) {
                if (elemData['record'][fieldName] > max) {
                    max = currElem.data()['record'][fieldName];
                }
            } else {
                if (elemData[fieldName] > max) {
                    max = currElem.data()[fieldName];
                }
            }
        }
        return max;
    }

    private updateCurrentSelectionStatus(elements) {

        // select no elem/ unselect
        if (elements.length === 0) {
            this.lastSelectedElement = undefined;
            this.classStyleOfLastSelectedElement = undefined;
            this.classNameOfLastSelectedElement = undefined;
        } else if (elements.length === 1) {    // select single elem
            this.lastSelectedElement = elements[0].json();
            this.classStyleOfLastSelectedElement = this.getClassStyleOfLastSelectedElement(this.lastSelectedElement['data']['class']);
            this.classNameOfLastSelectedElement = this.lastSelectedElement['data']['class'];
        } else if (elements.length > 0) {     // select more elems, the last one is chosen as the last selected
            this.lastSelectedElement = elements[elements.length - 1].json();
            this.classStyleOfLastSelectedElement = this.getClassStyleOfLastSelectedElement(this.lastSelectedElement['data']['class']);
            this.classNameOfLastSelectedElement = this.lastSelectedElement['data']['class'];
        }
        this.updateComponentsDependingOnElements();

    }

    unselectElementOnTableAction(event) {

        // unselect the element in cytoscape
        const toUnselElementId = event['toUnselElementId'];
        this.cy.$('#' + toUnselElementId).unselect();
    }

    selectElementOnTableAction(event) {

        // select the element in cytoscape
        const toSelElementId = event['toSelElementId'];
        this.cy.$('#' + toSelElementId).select();
    }

    deleteElementOnTableAction(event) {

        // unselect the element in cytoscape
        const toDelElementId = event['toDelElementId'];
        this.graphDeleteElementById(toDelElementId);
    }

    updateComponentsDependingOnElements() {

        // table updating
        this.updateTable();

        // traverse menu updating
        this.updateTraverseMenu();
    }

    updateTable() {
        this.updateTableInputColumns();
        let tableInputElements: Object[] = [];
        if (this.cy) {
            tableInputElements = this.cy.elements().jsons();
        }
        this.updateTableInputElements(tableInputElements);
    }

    /**
     * It's called to update the input columns for the table component when occurs:
     * - elements adding in the current dataset
     * - elements removing from the current dataset
     * Will be included all the columns for each class having at least an element in the current dataset.
     */
    updateTableInputColumns() {

        this.tableInputColumns = [];
        this.tableInputClassNames = this.getAllClassNamesWithElementsInCurrentDataset();
        for (const className of this.tableInputClassNames) {
            let properties;
            if (this.dataSourceMetadata['nodesClasses'][className]) {
                properties = this.dataSourceMetadata['nodesClasses'][className]['properties'];
            } else if (this.dataSourceMetadata['edgesClasses'][className]) {
                properties = this.dataSourceMetadata['edgesClasses'][className]['properties'];
            }
            if (properties != null) {
                for (const propertyName of Object.keys(properties)) {
                    const currProperty = properties[propertyName];
                    const currPropertyInfo = {
                        className: className,
                        name: propertyName,
                        type: currProperty['type'],
                        included: true
                    };
                    this.tableInputColumns.push(currPropertyInfo);
                }
            }
        }
    }

    /**
     * It's called to update the input elements for the table component when occurs:
     * - elements selection/unselection
     * - elements showing/hiding
     * - elements adding in the current dataset
     * - elements removing from the current dataset
     * All the elements will be included, then the set is ordere according to selection order.
     */
    updateTableInputElements(tableInputElements: Object[]) {

        if (this.currentRunningLayout && this.lastLayoutName === 'force') {
            // ignore the updating as it's due to the remove and restore operations caused by the data exchange between cytoscape and vivagraph
        } else {
            this.tableInputElementsCardinality = tableInputElements.length;
            if (this.tableInputElementsCardinality > 0) {
                if (this.tableTabEnabled) {
                    this.updateTableDataWhenTableReady('tabTable', tableInputElements);
                } else {
                    this.updateTableDataWhenTableReady('bottomTable', tableInputElements);
                }
            }
        }
    }

    updateTraverseMenu() {

        if (this.currentRunningLayout && this.lastLayoutName === 'force') {
            // ignore the updating as it's due to the remove and restore operations caused by the data exchange between cytoscape and vivagraph
        } else {
            const selectedNodes: Object[] = this.getShownSelectedNodes();
            this.selectedNodesCardinality = selectedNodes.length;
            if (this.selectedNodesCardinality > 0 && this.traverseMenu) {
                this.traverseMenu.buildMenuItems(selectedNodes);
            }
        }
    }

    getSelectedElements() {
        return this.cy.$(':selected');
    }

    getShownSelectedNodes(): Object[] {

        let nodes = [];
        if (this.cy) {
            nodes = this.cy.$(':selected').filter(function(elem) {
                if (elem.isNode() && elem.visible()) {
                    return true;
                }
                return false;
            });
        }
        return (<any>nodes).jsons();
    }

    updateTableDataWhenTableReady(tableName: string, tableInputElements: Object[]) {
        let table = undefined;
        if (tableName === 'tabTable') {
            table = this.tabTable;
        } else {
            table = this.bottomTable;
        }
        if (table) {
            table.setData(tableInputElements);
        } else {
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.updateTableDataWhenTableReady(tableName, tableInputElements);
                }, 100);
            });
        }
    }

    callTableSelectionSort() {

        if (this.tableTabEnabled) {
            // we have to sort the tabTable (we will wait if not present yet)
            if (this.tabTable) {
                this.tabTable.sortInputElementsBySelectionColumn('asc');
            } else {
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        if (this.tabTable) {
                            this.tabTable.sortInputElementsBySelectionColumn('asc');
                        } else {
                            this.callTableSelectionSort();
                        }
                    }, 50);
                });
            }
        } else {
            // we have to sort the bottomTable (we will wait if not present yet)
            if (this.bottomTable) {
                this.bottomTable.sortInputElementsBySelectionColumn('asc');
            } else {
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        if (this.bottomTable) {
                            this.bottomTable.sortInputElementsBySelectionColumn('asc');
                        } else {
                            this.callTableSelectionSort();
                        }
                    }, 50);
                });
            }
        }
    }

    makeColumnsChangeDetected() {
        this.tableInputColumns = [...this.tableInputColumns];
    }

    selectAllPropertiesOfClass(className: string) {
        for (const property of this.tableInputColumns) {
            if (property['className'] === className && !property['included']) {
                property['included'] = true;
            }
        }
    }

    deselectAllPropertiesOfClass(className: string) {
        for (const property of this.tableInputColumns) {
            if (property['className'] === className && property['included']) {
                property['included'] = false;
            }
        }
    }

    getAllClassNamesWithElementsInCurrentDataset(): string[] {
        const classNames = new Set();
        if (this.cy) {
            this.cy.batch(() => {
                const elements = this.cy.elements().jsons();
                elements.forEach((elem) => {
                    classNames.add(elem['data']['class']);
                });
            });
        }
        return Array.from(classNames);
    }

    generateNewColor() {

        const hue = this.getNextHue();

        const options = {
            luminosity: 'light',
            hue: hue
        };

        let color;

        // generating a new color never used by another node class nor edge class, then add it to the array of used colors
        do {
            color = randomColor(options);
        }
        while (this.colors.indexOf(color) !== -1);
        this.colors.push(color);

        return color;
    }

    getNextHue() {
        const hue: string = this.hues[this.hueIndex];
        this.hueIndex++;
        if (this.hueIndex >= this.hues.length) {
            this.hueIndex = 0;
        }
        return hue;
    }

    /**
     * Event bus methods
     */

    onSubsetSelection(message: SubsetSelectionChangeMessageContent) {

        if (message.primaryWidgetId && message.secondaryWidgetId &&
            message.class2property && message.propertyValues) {

            let finalElements = this.cy.collection();
            for (const curreFilteringRule of message['class2property']) {

                const currClassName = curreFilteringRule['className'];
                const classElements = this.cy.$('*.' + this.escapeSelector(currClassName));
                for (const currPropertyValue of message['propertyValues']) {
                    const currFilteredElements = classElements.filter((element) => {
                        const currElemData = element.data()['record'];
                        const currPropertyname = curreFilteringRule['property'];
                        // tslint:disable-next-line:triple-equals
                        if (currElemData[currPropertyname] == currPropertyValue) {
                            return true;
                        }
                        return false;
                    });
                    finalElements = finalElements.union(currFilteredElements);
                }
            }

            // cleaning previous selection
            this.graphUnselectAll();
            if (this.lastSelectedElement) {
                this.lastSelectedElement = undefined;
            }

            if (finalElements.length > 0) {

                // new selection
                this.cy.batch(() => {
                    finalElements.select();
                });
            }

            if (this.principal.hasAnyAuthorityDirect(['ROLE_ADMIN', 'ROLE_EDITOR'])) {
                this.saveAll(true);
            }
        }
    }

    /**
     * Graph functions
     */

    graphFilterElementsOfClass(type: string, divId: string, className: string) {

        const elements = this.cy.$(type + '.' + this.escapeSelector(className));
        if (elements.length === 0) {
            return;
        }

        if (elements[0].selectable()) {
            this.graphHideElements(type, elements, true);
            $('#' + divId).css('opacity', '0.5');
        } else {
            this.graphShowElements(type, elements);
            $('#' + divId).css('opacity', '1');
        }
    }

    graphDeleteSelected(group: string) {
        this.deleteSelection(group, this.cy.$(':selected'));
    }

    graphDeleteElementById(id: string) {

        const elem = this.cy.$('#' + id);
        const elemType = elem.json()['data']['type'];
        let vCount = 0;
        let eCount = 0;

        if (elemType === 'e') {
            elem.remove();
            eCount = 1;
        } else if (elemType === 'v') {
            vCount = 1;
            const connectedEdges = elem.connectedEdges();
            eCount += connectedEdges.length;

            elem.remove();
            connectedEdges.remove();
        }

        const messageTitle = 'Deleted elements';
        const message = 'Deleted ' + (vCount + eCount) + ' elements (' + vCount + ' vertices and ' + eCount + ' edges)';
        this.notificationService.push('success', messageTitle, message);

        this.graphUpdateLegend();
        this.updateTimelineInput();

        this.graphOptimizeEdgeClassStyle();

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;
    }

    graphHideElementById(node: any) {
        const id: string = node['data']['id'];
        const elem = this.cy.$('#' + id).addClass('invisible').lock();
        elem.data('hidden', true);

        this.updateComponentsDependingOnElements();

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;

        // items to context menu will be added when the new style class will be applied.
        // This event is catched as a cytoscape event.
    }

    graphShowElementById(node: any) {
        const id: string = node['data']['id'];
        const elem = this.cy.$('#' + id).removeClass('invisible').selectify().unlock();
        elem.data('hidden', false);

        this.updateComponentsDependingOnElements();

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;

        // items to context menu will be added when the new style class will be applied.
        // This event is catched as a cytoscape event.
    }

    graphDeleteNotSelected(group: string) {
        this.deleteSelection(group, this.cy.$(':selected').absoluteComplement());
    }

    /**
     * It deletes all the passed elements belonging to the passed group ( all | nodes | edges ).
     *
     * @param group
     * @param elements
     */
    deleteSelection(group: string, elements: any) {

        let vCount = 0;
        let eCount = 0;
        this.cy.batch(() => {

            if (group === 'all' || group === 'edges') {
                const edges = elements.edges();
                eCount += edges.length;
                edges.remove();
            }

            if (group === 'all' || group === 'vertices') {
                const vertices = elements.nodes();
                vCount = vertices.length;
                const connectedEdges = vertices.connectedEdges();
                eCount += connectedEdges.length;

                connectedEdges.remove();
                vertices.remove();
            }

        });

        const messageTitle = 'Deleted elements';
        const message = 'Deleted ' + (vCount + eCount) + ' elements (' + vCount + ' vertices and ' + eCount + ' edges)';
        this.notificationService.push('success', messageTitle, message);

        this.graphUpdateLegend();
        this.updateTimelineInput();

        this.graphOptimizeEdgeClassStyle();

        if (this.autoLayout && this.cy.elements().length > 0) {
            this.applyLastLayout();
        }

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;
    }

    crop() {
        const elements = this.cy.$(':selected');
        if (elements.length === 0) {
            const message = 'You need to select some elements to crop your selection.';
            this.notificationService.push('warning', 'Crop', message);
        } else {
            this.graphDeleteNotSelected('all');
        }
    }

    /**
     * It changes labels visibility for nodes or edges according to the requested state set through the switchery.
     * @param groupSelector
     */
    updateLabelVisibility(groupSelector) {
        this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {        // wait till the switchery has actually changed the variable value
                if (groupSelector === 'node') {
                    if (this.showNodeLabels) {
                        this.showLabels(groupSelector);
                    } else {
                        this.hideLabels(groupSelector);
                    }
                } else if (groupSelector === 'edge') {
                    if (this.showEdgeLabels) {
                        this.showLabels(groupSelector);
                    } else {
                        this.hideLabels(groupSelector);
                    }
                }
            }, 100);
        });
    }

    /**
     * It adds/remove a new 'edge' class style in order to apply/discharge the following optimizations:
     * - hide labels and disable text-rotation
     * @param remove
     */
    graphOptimizeEdgeClassStyle() {

        const styleClassSelectors = this.getCytoscapeStyleClasses();
        let basicEdgeStyleClassSelector;
        for (const currentStyle of styleClassSelectors) {
            if (currentStyle['selector'] === 'edge' && currentStyle['style']['label'] !== '') {
                basicEdgeStyleClassSelector = currentStyle;
                break;
            }
        }

        if (this.cy.edges().length > this.GRAPH_MAX_EDGES_ANIMATION) {
            this.hideLabels('edge');
            // basicEdgeStyleClassSelector.style['curve-style'] = 'bezier';
        } else {
            this.showLabels('edge');
            // basicEdgeStyleClassSelector.style['curve-style'] = 'bezier';
        }

        this.cy.style().fromJson(styleClassSelectors).update();

        // updating to-save flag
        this.toSave = true;
    }

    /**
     * It adds a new class style in order to hide all the labels.
     * @param elementTypeSelector: 'node' | 'edge'
     */
    hideLabels(elementTypeSelector: string) {

        const newEdgeStyleClass = {
            selector: elementTypeSelector,
            style: {
                'label': '',
                'edge-text-rotation': null
            }
        };

        const styleClassSelectors = this.getCytoscapeStyleClasses();
        // - removing the old <elementTypeSelector> class style
        // - adding the new style class in last position
        let index = 0;
        for (const currentStyle of styleClassSelectors) {
            if (currentStyle['selector'] === elementTypeSelector && currentStyle['style']['label'] === '') {
                styleClassSelectors.splice(index, 1);
                break;
            }
            index++;
        }
        styleClassSelectors.push(newEdgeStyleClass);
        this.cy.style().fromJson(styleClassSelectors).update();

        // updating to-save flag
        this.toSave = true;
    }

    /**
     * It removes the last 'node' or 'edge' class style in order to show all the labels again.
     * @param elementTypeSelector: 'node' | 'edge'
     */
    showLabels(elementTypeSelector: string) {
        const styleClassSelectors = this.getCytoscapeStyleClasses();
        // removing just the <elementTypeSelector> class style having label empty
        let index = 0;
        for (const currentStyle of styleClassSelectors) {
            if (currentStyle['selector'] === elementTypeSelector && currentStyle['style']['label'] === '') {
                styleClassSelectors.splice(index, 1);
                break;
            }
            index++;
        }
        this.cy.style().fromJson(styleClassSelectors).update();

        // updating to-save flag
        this.toSave = true;
    }

    graphShowHidden() {
        this.cy.batch(() => {
            const elements = this.cy.$('.invisible');
            elements.forEach((currElem) => {
                if (currElem.isNode()) {
                    currElem.removeClass('invisible').selectify().unlock();
                    currElem.connectedEdges().removeClass('invisible').selectify().unlock();
                } else {
                    currElem.removeClass('invisible').selectify().unlock();
                }
            });
            elements.data('hidden', false);
        });
        this.updateComponentsDependingOnElements();

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;
    }

    cleanLegend() {
        $('.graph_vertexSelect').css('opacity', '1');
        $('.graph_edgeSelect').css('opacity', '1');
    }

    /**
     * Selections
     */

    graphSelectElementsOfClass(type: string, className: string, divId?: string) {

        // hiding context menu
        this.manuallyHideAndCleanContextMenu();

        if (this.cy) {
            if (divId) {
                this.graphSelectElementsOfClassAux(type, className, divId);
            } else {
                this.graphSelectElementsOfClassAux(type, className);
            }
        }
    }

    graphSelectElementsOfClassAux(type: string, className: string, divId?: string) {

        if (this.lastSelectedElement) {
            this.lastSelectedElement = undefined;
        }

        let elements;
        this.cy.batch(() => {
            elements = this.cy.$(type + '.' + this.escapeSelector(className));
            if (elements.length === 0) {
                return;
            }

            if (elements[0].selected()) {
                elements.unselect();
            } else {
                elements.select();
            }
        });

        if (divId) {
            if (elements[0].selected()) {
                $('#' + divId).css('opacity', '0.5');
            } else {
                $('#' + divId).css('opacity', '1');
            }
        }

        this.graphUpdateLegend();
    }

    graphSelectAll() {

        // hiding context menu
        this.manuallyHideAndCleanContextMenu();

        const elements = this.cy.elements();
        this.graphSelectElements(elements);

        // updating the Legend
        $('.graph_vertexSelect').css('opacity', '0.5');
        $('.graph_edgeSelect').css('opacity', '0.5');
    }

    graphUnselectAll() {

        const selectedEles = this.cy.$(':selected');

        if (selectedEles.length > 0) {

            this.graphUnselectElements(selectedEles);

            // updating the Legend
            this.cleanLegend();
        }
    }

    graphSelectElements(elements, selectify?: boolean) {
        this.cy.batch(() => {
            if (selectify) {
                elements.selectify();
            }
            elements.select();
        });

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
    }

    graphUnselectElements(elements, selectify?: boolean) {
        this.cy.batch(() => {
            if (selectify) {
                elements.selectify();
            }
            elements.unselect();
        });

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
    }

    graphSelectVerticesOnly() {
        const selectedEles = this.cy.$(':selected');
        let selectedEdges;

        this.cy.batch(() => {
            selectedEdges = selectedEles.filterFn(function(ele) {
                return !ele.isNode();
            });
        });

        this.graphUnselectElements(selectedEdges);

        // updating the Legend
        $('.graph_edgeSelect').css('opacity', '1');

        this.updateCurrentSelectionStatus(selectedEles);
    }

    graphSelectEdgesOnly() {
        const selectedEles = this.cy.$(':selected');
        let selectedVertices;

        this.cy.batch(() => {
            selectedVertices = selectedEles.filterFn(function(ele) {
                return ele.isNode();
            }).unselect();
        });

        this.graphUnselectElements(selectedVertices);

        // updating the Legend
        $('.graph_vertexSelect').css('opacity', '1');

        this.updateCurrentSelectionStatus(selectedEles);
    }

    graphSelectInverted() {

        this.cleanLegend();

        const elements = this.cy.$(':selected');

        this.graphUnselectElements(elements);
        this.graphSelectElements(elements.absoluteComplement());

        this.updateCurrentSelectionStatus(elements);
    }

    graphSelectNotConnectedVertices() {

        this.cleanLegend();

        let notConnectedVertices = this.cy.nodes();
        this.cy.batch(() => {
            notConnectedVertices = notConnectedVertices.filterFn(function(ele) {
                return ele.connectedEdges().length === 0;
            });
        });

        this.graphSelectElements(notConnectedVertices);

        this.updateCurrentSelectionStatus(notConnectedVertices);
    }

    /**
     * Algorithms
     */

    graphExecuteAlgorithm(algorithm: string) {

        this.cleanLegend();

        if (algorithm === 'shortest-path') {
            this.performShortestPath();
        } else if (algorithm === 'pageRank') {
            this.performPageRank();

            // update style class applying according to the new computed ranks
            this.updateCytoscapeStyleClassApplying();
        } else if (algorithm === 'centrality') {
            this.performCentrality();

            // update style class applying according to the new computed ranks
            this.updateCytoscapeStyleClassApplying();
        } else {
            console.log('Sorry, not supported yet');
        }

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;
    }

    updateShortestPathNodesSelection(nodeRole: string, event) {
        if (nodeRole === 'from') {
            if (!this.shortestPathSourceNodeInputLabel) {
                this.shortestPathSourceNodeInputLabel = 'Select a node in the Graph';
            }
            this.shortestPathSelectingNode = 'from';
        } else if (nodeRole === 'to') {
            if (!this.shortestPathTargetNodeInputLabel) {
                this.shortestPathTargetNodeInputLabel = 'Select a node in the Graph';
            }
            this.shortestPathSelectingNode = 'to';
        }
    }

    cleanShortestPathNodesSelection(event) {
        setTimeout(() => {  // waiting for potential cy node selection event
            const currentTargetElement = event.relatedTarget;
            const inputShortestPathFrom = $('#shortestPathFrom').get(0);
            const inputShortestPathTo = $('#shortestPathTo').get(0);
            if (!this.shortestPathSourceNodeInputLabel && !this.shortestPathTargetNodeInputLabel) {
                this.shortestPathSourceNodeInputLabel = undefined;
                this.shortestPathTargetNodeInputLabel = undefined;
                this.shortestPathSourceNode = undefined;
                this.shortestPathTargetNode = undefined;

                this.shortestPathSelectingNode = undefined;
            } else {
                if (this.shortestPathSourceNodeInputLabel === 'Select a node in the Graph') {
                    if (currentTargetElement === null) {
                        // focus is on an not-focusable element different from the two shortest path inputs
                        this.cleanShortestPathInput('from');
                        this.shortestPathSelectingNode = undefined;
                    } else if (currentTargetElement === inputShortestPathTo) {
                        // focus is on the other input
                        this.cleanShortestPathInput('from');
                    } else if (currentTargetElement !== inputShortestPathFrom) {
                        // focus is on a focusable element different from the two shortest path inputs
                        this.cleanShortestPathInput('from');
                        this.shortestPathSelectingNode = undefined;
                    }
                } else {
                    if (currentTargetElement === null ||
                        (currentTargetElement !== inputShortestPathFrom && currentTargetElement !== inputShortestPathTo)) {
                        this.shortestPathSelectingNode = undefined;
                    }
                }
                if (this.shortestPathTargetNodeInputLabel === 'Select a node in the Graph') {
                    if (currentTargetElement === null) {
                        // focus is on an not-focusable element different from the two shortest path inputs
                        this.cleanShortestPathInput('to');
                        this.shortestPathSelectingNode = undefined;
                    } else if (currentTargetElement === inputShortestPathFrom) {
                        // focus is on the other input
                        this.cleanShortestPathInput('to');
                    } else if (currentTargetElement !== inputShortestPathTo) {
                        // focus is on a focusable element different from the two shortest path inputs
                        this.cleanShortestPathInput('to');
                        this.shortestPathSelectingNode = undefined;
                    }
                } else {
                    if (currentTargetElement === null ||
                        (currentTargetElement !== inputShortestPathFrom && currentTargetElement !== inputShortestPathTo)) {
                        this.shortestPathSelectingNode = undefined;
                    }
                }
            }
        }, 500);
    }

    cleanShortestPathInput(nodeRole: string) {
        if (nodeRole === 'from') {
            this.shortestPathSourceNodeInputLabel = undefined;
            this.shortestPathSourceNode = undefined;
        } else if (nodeRole === 'to') {
            this.shortestPathTargetNodeInputLabel = undefined;
            this.shortestPathTargetNode = undefined;
        }
    }

    performShortestPath() {

        const messageTitle: string = 'Shortest Path Function';

        if (!this.shortestPathSourceNode || !this.shortestPathTargetNode) {
            let message: string;
            if (!this.shortestPathSourceNode && !this.shortestPathTargetNode) {
                message = 'In order to execute the shortest path algorithm you have to select both the "source" and "target" nodes.';
            } else {
                if (!this.shortestPathSourceNode) {
                    message = 'In order to execute the shortest path algorithm you have to select the "source" node.';
                } else {
                    message = 'In order to execute the shortest path algorithm you have to select the "target" node.';
                }
            }
            this.notificationService.push('warning', messageTitle, message);
        } else if (this.shortestPathSourceNode && this.shortestPathTargetNode) {

            // cleaning previous output shortest path if any
            if (this.outputShortestPath) {
                this.cleanOutputShortestPath();
            }

            // cleaning previous selections and hiding context menu
            this.graphUnselectAll();
            if (this.contextMenuInstance) {
                this.manuallyHideAndCleanContextMenu();
            }

            let algorithmResult;
            let config;
            let distance;
            let inputGraph = this.cy.collection();
            inputGraph = inputGraph.union(this.cy.nodes());
            let edges = this.cy.edges();
            if (!this.shortestPathConfig['allClassesIncluded']) {
                if (this.shortestPathConfig['edgeClassesFilteredIn'].length === 0) {
                    edges = this.cy.collection();   // no classes filtered in, then no edges can be filtered in
                } else {
                    edges = edges.filter((edge) => {
                        const currEdge = edge.json();
                        const currEdgeClass = currEdge['data']['class'];
                        if (this.shortestPathConfig['edgeClassesFilteredIn'].indexOf(currEdgeClass) >= 0) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                }
            }
            inputGraph = inputGraph.union(edges);
            if (this.shortestPathConfig['executionAlgorithm'] === 'astar') {
                config = {
                    root: this.shortestPathSourceNode,
                    goal: this.shortestPathTargetNode,
                    directed: this.shortestPathConfig['directed'],
                    weight: (edge) => {
                        return this.weightFunction(edge.data(), 'shortest-path');
                    }
                };
                algorithmResult = inputGraph.aStar(config);
                this.outputShortestPath = algorithmResult.path;
                distance = algorithmResult.distance;
                if (this.outputShortestPath) {
                    // selecting the output path
                    this.outputShortestPath.select();
                    this.outputShortestPath.flashClass('highlighted', 3000);
                }
            } else if (this.shortestPathConfig['executionAlgorithm'] === 'dijkstra') {
                config = {
                    root: this.shortestPathSourceNode,
                    directed: this.shortestPathConfig['directed'],
                    weight: (edge) => {
                        return this.weightFunction(edge.data(), 'shortest-path');
                    }
                };
                inputGraph = {
                    nodes: this.cy.nodes().jsons(),
                    edges: edges.jsons()
                };
                this.serverSideShortestPath('dijkstra', this.shortestPathSourceNode.id(), this.shortestPathTargetNode.id(), inputGraph)
                    .subscribe((res: Object) => {
                        const partialPath = res['path'];
                        if (partialPath.length > 0) {
                            this.outputShortestPath = this.cy.collection();
                            for (const currEdgeRetrieved of partialPath) {
                                const currEdge = this.cy.$('#' + currEdgeRetrieved['id']);
                                const currEdgeSource = currEdge.source();
                                const currEdgeTarget = currEdge.target();
                                this.outputShortestPath.merge(currEdgeSource);
                                this.outputShortestPath.merge(currEdge);
                                this.outputShortestPath.merge(currEdgeTarget);
                            }
                            distance = res['distance'];

                            // selecting the output path
                            this.outputShortestPath.select();
                            this.outputShortestPath.flashClass('highlighted', 3000);
                        }
                        // showing messages
                        this.showShortestPathResponseMessage(messageTitle, this.outputShortestPath, distance);
                    }, (error: HttpErrorResponse) => {
                        this.stopSpinner();
                        this.handleError(error.error, 'Server side layout');
                    });
                return;
            }
            this.showShortestPathResponseMessage(messageTitle, this.outputShortestPath, distance);
        }
    }

    showShortestPathResponseMessage(messageTitle: string, path, distance: number) {

        if (!path) {
            this.notificationService.push('warning', messageTitle, 'The two selected vertices are not connected.');
            return;
        }

        const numberOfEdges = ((path.length - 1) / 2);

        if (numberOfEdges === 0) {  // handling the server side function that return a path anyway
            this.notificationService.push('warning', messageTitle, 'The two selected vertices are not connected.');
            return;
        }

        let message = 'The two vertices are connected by ' + numberOfEdges;
        if (numberOfEdges === 1) {
            message += ' edge.\n';
        } else if (numberOfEdges > 1) {
            message += ' edges.\n';
        }
        message += 'Distance: ' + distance;
        this.notificationService.push('success', messageTitle, message);
    }

    cleanOutputShortestPath() {
        this.outputShortestPath.selectify().unselect();
        this.outputShortestPath = undefined;
    }

    weightFunction(edge, algorithmName) {
        const edgeClassName: string = edge['class'];
        let weightField;
        if (algorithmName === 'shortest-path') {
            weightField = this.shortestPathConfig['weightFields'][edgeClassName];
        } else if (algorithmName === 'centrality') {
            weightField = this.centralityConfig['weightFields'][edgeClassName];
        }
        if (weightField) {
            const weight = edge['record'][weightField];
            return weight;
        } else {
            return 1;
        }
    }

    swapShortestPathInputVertices() {
        const tmpSourceNode = this.shortestPathSourceNode;
        const tmpSourceNodeLabel = this.shortestPathSourceNodeInputLabel;

        this.shortestPathSourceNode = this.shortestPathTargetNode;
        this.shortestPathSourceNodeInputLabel = this.shortestPathTargetNodeInputLabel;

        this.shortestPathTargetNode = tmpSourceNode;
        this.shortestPathTargetNodeInputLabel = tmpSourceNodeLabel;
    }

    serverSideShortestPath(algorithmName: string, sourceVertexId: string,
        targetVertexId: string, inputGraph): Observable<Object> {

        inputGraph['nodes'].forEach((node) => {
            delete node['removed'];
            delete node['data']['type'];
            delete node['data']['class'];
            delete node['data']['edgeCount'];
        });
        inputGraph['edges'].forEach((edge) => {
            delete edge['removed'];
            delete edge['data']['type'];
            delete edge['data']['class'];
        });
        const json = {
            inputGraph: inputGraph
        };

        json['shortestPathConfig'] = JSON.parse(JSON.stringify(this.shortestPathConfig));
        json['sourceVertexId'] = sourceVertexId;
        json['targetVertexId'] = targetVertexId;
        delete json['shortestPathConfig']['allClassesIncluded'];
        delete json['shortestPathConfig']['edgeClassesFilteredIn'];
        const jsonInput = JSON.stringify(json);

        return this.widgetService.algorithm(algorithmName, jsonInput);
    }

    performPageRank() {

        if (this.cy) {

            const infoNotification = this.notificationService.push('info', 'Page Rank', 'Computing rank for all the nodes in the graph...', 3000, 'fa fa-spinner fa-spin');
            const newPropertyName = 'pageRank';
            const pr = this.cy.elements().pageRank();

            // for each vertex v computing per pr(v), that is the pageRank value for the specific node
            this.cy.batch(() => {
                this.cy.nodes().forEach((node) => {
                    const nodeId: string = '#' + node.id();
                    const nodeRank = pr.rank(nodeId);
                    node.json()['data']['record']['pageRank'] = nodeRank;
                });
            });

            const message: string = 'Page Rank successfully performed: new \'pageRank\' field added in all the nodes.';
            this.notificationService.updateNotification(infoNotification, 'success', 'Page Rank', message, undefined, true);

            // unselect the last selected element and then select it again: in this way the graph element menu updating will be triggered and
            // the input properties to the menu will be coherent with the current nodes' content status
            const tmp = this.lastSelectedElement;
            this.lastSelectedElement = undefined;
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {  // waiting for graph element menu destroy, then select the last selected elemen again in order to see the last content
                    this.lastSelectedElement = tmp;
                }, 50);
            });

            // updating metadata for all the classes
            this.updateDatasourceMetadataWithAlgorithmProperty(newPropertyName);
        } else {
            this.notificationService.push('info', 'Page Rank', 'Current dataset not initialised yet. Load some data then try again.');
        }
    }

    performCentrality() {

        if (!this.cy) {
            this.notificationService.push('info', 'Centrality', 'Current dataset not initialised yet. Load some data then try again.');
        } else {
            const infoNotification = this.notificationService.push('info', 'Centrality', 'Computing centrality for all the nodes in the graph...', 3000, 'fa fa-spinner fa-spin');
            const messageTitle: string = 'Centrality Function';

            // cleaning previous selections and hiding context menu
            this.graphUnselectAll();
            if (this.contextMenuInstance) {
                this.manuallyHideAndCleanContextMenu();
            }

            let algorithmResult;
            let config;
            let newPropertyName;
            let inputGraph = this.cy.collection();
            inputGraph = inputGraph.union(this.cy.edges());
            inputGraph = inputGraph.union(this.cy.nodes());
            if (this.centralityConfig['executionAlgorithm'] === 'closeness-centrality') {
                config = {
                    directed: this.centralityConfig['directed'],
                    weight: (edge) => {
                        return this.weightFunction(edge.data(), 'centrality');
                    },
                    harmonic: this.centralityConfig['harmonic']
                };
                algorithmResult = inputGraph.closenessCentralityNormalized(config);

                // for each vertex v computing per closeness(v), that is the closeness centrality value for the specific node
                this.cy.batch(() => {
                    let nodes = this.cy.nodes();
                    if (!this.centralityConfig['allClassesIncluded']) {
                        if (this.centralityConfig['nodeClassesFilteredIn'].length === 0) {
                            nodes = this.cy.collection();   // no classes filtered in, then no edges can be filtered in
                        } else {
                            nodes = nodes.filter((node) => {
                                const currNode = node.json();
                                const currNodeClass = currNode['data']['class'];
                                if (this.centralityConfig['nodeClassesFilteredIn'].indexOf(currNodeClass) >= 0) {
                                    return true;
                                } else {
                                    return false;
                                }
                            });
                        }
                    }
                    newPropertyName = 'closenessCentrality';
                    nodes.forEach((node) => {
                        const nodeId: string = '#' + node.id();
                        const nodeRank = algorithmResult.closeness(nodeId);
                        node.json()['data']['record'][newPropertyName] = nodeRank;
                    });
                });

                // updating metadata for all the classes
                const classesToEdit: string[] = [];
                if (!this.centralityConfig['allClassesIncluded'] && this.centralityConfig['nodeClassesFilteredIn'].length > 0) {
                    for (const className of this.centralityConfig['nodeClassesFilteredIn']) {
                        classesToEdit.push(className);
                    }
                }
                if (classesToEdit.length === 0) {
                    this.updateDatasourceMetadataWithAlgorithmProperty(newPropertyName);
                } else {
                    this.updateDatasourceMetadataWithAlgorithmProperty(newPropertyName, classesToEdit);
                }

                const message: string = 'Closeness Centrality successfully performed: new \'closenessCentrality\' field added in all the nodes.';
                this.notificationService.updateNotification(infoNotification, 'success', 'Centrality', message, undefined, true);
            } else if (this.centralityConfig['executionAlgorithm'] === 'betweenness-centrality') {
                config = {
                    directed: this.centralityConfig['directed'],
                    weight: (edge) => {
                        return this.weightFunction(edge.data(), 'centrality');
                    },
                };
                algorithmResult = inputGraph.betweennessCentrality(config);

                // for each vertex v computing per closeness(v), that is the closeness centrality value for the specific node
                this.cy.batch(() => {
                    let nodes = this.cy.nodes();
                    if (!this.centralityConfig['allClassesIncluded']) {
                        if (this.centralityConfig['nodeClassesFilteredIn'].length === 0) {
                            nodes = this.cy.collection();   // no classes filtered in, then no edges can be filtered in
                        } else {
                            nodes = nodes.filter((node) => {
                                const currNode = node.json();
                                const currNodeClass = currNode['data']['class'];
                                if (this.centralityConfig['nodeClassesFilteredIn'].indexOf(currNodeClass) >= 0) {
                                    return true;
                                } else {
                                    return false;
                                }
                            });
                        }
                    }
                    newPropertyName = 'betweennessCentrality';
                    nodes.forEach((node) => {
                        const nodeId: string = '#' + node.id();
                        const nodeRank = algorithmResult.betweenness(nodeId);
                        node.json()['data']['record'][newPropertyName] = nodeRank;
                    });
                });

                // updating metadata for all the classes
                const classesToEdit: string[] = [];
                if (!this.centralityConfig['allClassesIncluded'] && this.centralityConfig['nodeClassesFilteredIn'].length > 0) {
                    for (const className of this.centralityConfig['nodeClassesFilteredIn']) {
                        classesToEdit.push(className);
                    }
                }
                if (classesToEdit.length === 0) {
                    this.updateDatasourceMetadataWithAlgorithmProperty(newPropertyName);
                } else {
                    this.updateDatasourceMetadataWithAlgorithmProperty(newPropertyName, classesToEdit);
                }

                const message: string = 'Betweenness Centrality successfully performed: new \'closenessCentrality\' field added in all the nodes.';
                this.notificationService.updateNotification(infoNotification, 'success', 'Centrality', message, undefined, true);
            }

            // unselect the last selected element and then select it again: in this way the graph element menu updating will be triggered and
            // the input properties to the menu will be coherent with the current nodes' content status
            const tmp = this.lastSelectedElement;
            this.lastSelectedElement = undefined;
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {  // waiting for graph element menu destroy, then select the last selected elemen again in order to see the last content
                    this.lastSelectedElement = tmp;
                }, 50);
            });
        }
    }

    /**
     * It's called after the execution of all the algorithms whose output is a new property on the nodes (like page rank and centrality).
     * It accepts two params:
     * - a property name to identify the new added value
     * - an optional array of classes: if any only the classes contained in it will be updated otherwise all the classes will be updated
     * @param newPropertyName
     * @param classesToEdit
     */
    updateDatasourceMetadataWithAlgorithmProperty(newPropertyName: string, classesToEdit?: string[]) {

        let classesNames: string[];
        if (classesToEdit) {
            classesNames = classesToEdit;
        } else {
            classesNames = Object.keys(this.dataSourceMetadata['nodesClasses']);
        }

        for (const className of classesNames) {
            const classMetadata = this.dataSourceMetadata['nodesClasses'][className];
            classMetadata['properties'][newPropertyName] = {
                name: newPropertyName,
                type: 'LONG'
            };
        }
    }

    graphSelectNeighbors(direction: string) {

        this.cleanLegend();

        let currentRange;
        if (direction === 'out') {
            currentRange = this.outNeighbourRange;
        } else if (direction === 'in') {
            currentRange = this.inNeighbourRange;
        }

        let rootElementsForSelection: any = this.cy.$(':selected');
        if (this.lastAppliedDepthRangeSelection && this.lastAppliedDepthRangeSelection[1] > currentRange[1]) {   // decreasing range

            // then unselect all the neighbours till the last applied depth
            for (let i = 1; i <= this.lastAppliedDepthRangeSelection[1]; ++i) {
                const next = direction === 'out' ? rootElementsForSelection.outgoers() : rootElementsForSelection.incomers();
                if (next.length === 0) {
                    break;
                }
                rootElementsForSelection = next;

                if (i >= currentRange[0] && i <= currentRange[1]) {     // then select this level
                    next.select();
                } else {    // then unselect this level
                    next.unselect();
                }
            }
        } else {    // first range applying or increasing range

            for (let i = 1; i <= currentRange[1]; ++i) {
                const next = direction === 'out' ? rootElementsForSelection.outgoers() : rootElementsForSelection.incomers();
                if (next.length === 0) {
                    break;
                }
                rootElementsForSelection = next;

                if (i >= currentRange[0]) {
                    next.select();
                }
            }
        }

        // updating the last applied range
        this.lastAppliedDepthRangeSelection = currentRange;

        this.updateCurrentSelectionStatus(rootElementsForSelection);
    }

    /**
     * Timeline handling
     */

    prepareTimelineClasses() {
        if (this.newTimelineInputClassType === 'node') {
            this.timelineChoosableClassesNames = this.nodeClassesNames;
            this.newTimelineInputClass = this.nodeClassesNames[0];
        } else if (this.newTimelineInputClassType === 'edge') {
            this.timelineChoosableClassesNames = this.edgeClassesNames;
            this.newTimelineInputClass = this.edgeClassesNames[0];
        } else {
            console.log('[GraphWidgetComponent.prepareTimelineClasses()]: wrong class type.');
        }
        this.updateTimelineClassProperties();
        this.newTimelineInputProperty = this.timelineClassProperties[0]['name'];
    }

    updateTimelineClassProperties() {
        this.timelineClassProperties = [];
        if (!this.newTimelineInputClass) {
            // get the first class of the specific current type
            if (this.newTimelineInputClassType === 'node') {
                this.newTimelineInputClass = this.nodeClassesNames[0];
            } else {
                this.newTimelineInputClass = this.edgeClassesNames[0];
            }
        }
        this.timelineClassProperties = this.getClassProperties(this.newTimelineInputClassType, this.newTimelineInputClass);
    }

    getClassProperties(classType: string, className: string): Object[] {
        const classProperties: string[] = [];
        let classesMetadata;
        if (classType === 'node') {
            classesMetadata = this.dataSourceMetadata['nodesClasses'];
        } else {
            classesMetadata = this.dataSourceMetadata['edgesClasses'];
        }
        for (const propName of Object.keys(classesMetadata[className]['properties'])) {
            classProperties.push(classesMetadata[className]['properties'][propName]);
        }
        return classProperties;
    }

    addNewTimelineClass() {
        const newTimelineDateInfo = {
            classType: this.newTimelineInputClassType,
            class: this.newTimelineInputClass,
            property: this.newTimelineInputProperty,
            itemType: 'point'
        };
        this.className2timelineDateInfo[this.newTimelineInputClass] = newTimelineDateInfo;
        this.newTimelineInputClass = undefined;
        this.newTimelineInputProperty = undefined;

        // triggering timeline input update
        this.updateTimelineInput();
    }

    removeTimelineClass(className) {
        delete this.className2timelineDateInfo[className];

        // if we just removed the last property, close the timeline widget
        if (Object.keys(this.className2timelineDateInfo).length === 0) {
            this.activateTimeline = false;
        }

        // triggering timeline input update
        this.updateTimelineInput();
    }

    updateTimelineInput() {

        // update timeline input just if the timeline is already opened
        if (this.activateTimeline) {
            this.prepareDataForTimeline();
        }
    }

    toggleTimeline() {
        this.activateTimeline = !this.activateTimeline;
        this.handleTimelineSwitch();
    }

    handleTimelineSwitch() {

        if (this.activateTimeline) {    // opening the timeline

            // closing the bottom table if enabled
            if (!this.tableTabEnabled) {
                this.closeBottomTable();
            }

            this.prepareDataForTimeline();

            // resizing the graph row in order to fit the timeline
            this.widgetHeight = this.GRAPH_REDUCED_SIZE_FOR_TIMELINE;

            // tab table could be undefined if we have just closed the bottom table
            // in this case the correct number of items per page (10) will be set through the template directive
            if (this.tabTable) {
                // decreasing number of shown items per page in the table
                this.tabTable.updateNumberOfItemsPerPage(10);
            }
        } else {    // closing the timeline

            // resizing the graph row to full size
            if (this.tableTabEnabled) {
                // we can resize the graph
                this.widgetHeight = this.startingWidgetHeight;
            }

            // tab table could be undefined
            // in this case the correct number of items per page (10) will be set through the template directive
            if (this.tabTable) {
                // increasing number of shown items per page in the table
                this.tabTable.updateNumberOfItemsPerPage(15);
            }

            // show again all the elements
            this.graphShowHidden();
        }
    }

    prepareDataForTimeline() {

        this.timelineInputItems = [];

        for (const currClass of Object.keys(this.className2timelineDateInfo)) {
            const currTimelineDateInfo = this.className2timelineDateInfo[currClass];
            const currDateProperty = currTimelineDateInfo['property'];
            const currItemType = currTimelineDateInfo['itemType'];
            const selectedElements = this.cy.$(currTimelineDateInfo['classType'] + '.' + this.escapeSelector(currClass)).jsons();
            for (const currElement of selectedElements) {
                const currId = currElement['data']['id'];
                const currItem = {
                    id: currId,
                    content: currId,
                    title: currElement['data']['record'][currDateProperty],
                    start: currElement['data']['record'][currDateProperty],
                    type: currItemType,
                    className: currClass
                };
                // we are in the schemaless world, then if a vertex is missing a field exclude it from the timeline analysis
                if (currItem['id'] && currItem['content'] && currItem['title'] &&
                    currItem['start'] && currItem['type'] && currItem['className']) {
                    this.timelineInputItems.push(currItem);
                }
            }
        }
    }

    closeTimeline(delay?: number) {
        if (delay) {
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.activateTimeline = false;
                    this.handleTimelineSwitch();
                }, delay);
            });
        } else {
            this.activateTimeline = false;
            this.handleTimelineSwitch();
        }
        const message = 'Timeline cannot be opened as no acceptable elements are present in the current dataset according to the specified classes and date properties.';
        this.notificationService.push('warning', 'Timeline', message);
    }

    updateTimelineFilteringWindowState(event) {
        this.timelineFilteringWindowActive = event['filteringWindowActive'];
    }

    handleWrongClassTimelineConfig(event) {
        this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
                this.removeTimelineClass(event['className']);
            }, 100);
        });
    }

    /**
     * Bottom Table handling
     */

    toggleTablePerspective() {
        this.tableTabEnabled = !this.tableTabEnabled;
        this.handleTablePerspectiveSwitch();
    }

    handleTablePerspectiveSwitch() {

        if (!this.tableTabEnabled) {    // opening bottom table

            // switching to the graph tab if we are in the table one
            if (!this.graphTabActive) {
                this.switchTab('graph');
            }

            // closing the timeline if enabled
            if (this.activateTimeline) {
                this.closeTimeline();
            }

            // resizing the graph row in order to fit the timeline
            this.widgetHeight = this.GRAPH_REDUCED_SIZE_FOR_BOTTOM_TABLE;
        } else {    // closing bottom table
            // resizing the graph row to full size
            this.widgetHeight = this.startingWidgetHeight;

            // ordering tabs (Table must be before the Datasource Tab)
            this.orderTabs();
        }

        // updating input data for the new data
        const tableInputElements: Object[] = this.cy.elements().jsons();
        this.updateTableInputElements(tableInputElements);
    }

    orderTabs() {
        const tableTab = (<any>$('#tableTab')).get(0);
        const secondTabName = $((<any>$('.widget-viewport > .tab-container > .nav-tabs > .nav-item'))
            .get(1)).find('span').text();
        if (secondTabName === 'Datasource') {

            if (tableTab) {
                const datasourceTab = (<any>$('.widget-viewport > .tab-container > .nav-tabs > .nav-item'))
                    .get(1); // getting the second tab, that is the datasourceTab
                (<any>$('.widget-viewport > .tab-container > .nav-tabs')).append(datasourceTab);
            } else {
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        this.orderTabs();
                    }, 100);
                });
            }
        }
    }

    closeBottomTable() {
        this.tableTabEnabled = true;
        this.handleTablePerspectiveSwitch();
    }

    /**
     * Filterings
     */

    filterResetAll() {

        this.filterMenu.filterResetAll();
        this.filters = [];
        this.graphUnselectAll();
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

    graphFilterResults(newFilteringEvent?) {

        if (this.cy) {

            // updating filters according to the user form updating
            if (newFilteringEvent) {
                this.upgradeFilters(newFilteringEvent);
            }

            if (this.filters.length === 0) {
                this.graphUnselectAll();
                return;
            }

            let totalVerticesFilteredIn = undefined;
            for (const currentFilter of this.filters) {

                let verticesOfClass;
                this.cy.batch(() => {
                    verticesOfClass = this.cy.$('node.' + this.escapeSelector(currentFilter['className']));
                });
                const verticesFilteredIn = verticesOfClass.filter((ele) => {

                    const record = ele.data().record;
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

                this.graphSelectElements(verticesFilteredIn);
                totalVerticesFilteredIn = totalVerticesFilteredIn !== undefined ? totalVerticesFilteredIn.union(verticesFilteredIn) : verticesFilteredIn;
            }
            this.graphUnselectElements(totalVerticesFilteredIn.absoluteComplement());
        } else {
            this.notificationService.push('warning', 'Filter', 'Something has gone wrong with the elements filtering due to a rendering issue.');
            console.log('Cytoscape not initialised yet, filters cannot be correctly applied.');

        }
    }

    filterElementsAccordingToTimeline(event) {

        // saving in the local graph variable the timeline filtering window bounds
        this.timelineFilteringWindowStart = event['timelineFilteringWindowStart'];
        this.timelineFilteringWindowEnd = event['timelineFilteringWindowEnd'];

        // showing all in order to hide just the filtered out elements according to the last call
        this.graphShowHidden();

        let nodesToHide = this.cy.collection();
        let edgesToHide = this.cy.collection();

        for (const className of Object.keys(this.className2timelineDateInfo)) {
            const classInfo = this.className2timelineDateInfo[className];
            const currentClassElements = this.cy.$(classInfo['classType'] + '.' + this.escapeSelector(classInfo['class']));
            const currClassElementsToHide = currentClassElements.filter((node) => {
                const filteredIn = event['filteredIn'];
                if (filteredIn.indexOf(node.id()) >= 0) {
                    return false;
                }
                return true;
            });
            if (classInfo['classType'] === 'node') {
                nodesToHide = nodesToHide.union(currClassElementsToHide);
            } else {
                edgesToHide = edgesToHide.union(currClassElementsToHide);
            }
        }

        if (nodesToHide.size() > 0) {
            this.graphHideElements('node', nodesToHide, false);
        }
        if (edgesToHide.size() > 0) {
            this.graphHideElements('edge', edgesToHide, false);
        }

        // updating the legend
        this.graphUpdateLegend();
    }

    resetTimelineFiltering() {
        this.graphShowHidden();

        // saving in the local graph variable the timeline filtering window bounds
        this.timelineFilteringWindowStart = undefined;
        this.timelineFilteringWindowEnd = undefined;
    }

    graphHideElements(type: string, elements, removeSelection: boolean) {

        this.cy.batch(() => {
            elements.addClass('invisible').lock();
            elements.data('hidden', true);

            let edges;
            if (type === 'node') {
                edges = elements.connectedEdges();
                edges.addClass('invisible').lock();
            }

            if (removeSelection) {
                elements.unselect();

                if (type === 'node') {
                    edges.unselect();
                }
            }
        });
        this.updateComponentsDependingOnElements();

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;
    }

    /*
     * Shows all the elements according to the elements collection passed as param.
     * It calls the auxiliary method with the showConnectedEdges set true.
     */
    graphShowElements(type: string, elements) {
        this.graphShowElementsAux(type, elements, true);
        this.updateComponentsDependingOnElements();

        // updating to-save and new-dataset-to-propagate flags
        this.toSave = true;
        this.newDatasetToPropagate = true;
    }

    /*
     * Shows all the elements according to the elements collection passed as param.
     * If the collection contains nodes, the connected edges are shown according to the showConnectedEdges boolean.
     */
    graphShowElementsAux(type: string, elements, showConnectedEdges: boolean) {

        this.cy.batch(() => {
            elements = elements.filter('.invisible');
            elements.removeClass('invisible').selectify();
            elements.unlock();

            if (type === 'node' && showConnectedEdges) {
                elements.connectedEdges().removeClass('invisible').selectify();
                elements.connectedEdges().unlock();
            }
            elements.data('hidden', false);
        });
    }

    /**
     * It adds the new entering nodes and edges, it cleans up both the entering eles collection.
     */
    addLoadingElementsToGraph(selectEnteringNodes: boolean) {

        const numberOfNodes = this.loadingNodes.length;
        if (numberOfNodes > 0) {

            // adding nodes
            let numberOfChunks = Math.ceil(numberOfNodes / this.CY_ADDING_ELEMENTS_BATCH_SIZE);
            for (let i = 0; i < numberOfChunks; i++) {
                this.cy.batch(() => {
                    const lowerIndex: number = i * this.CY_ADDING_ELEMENTS_BATCH_SIZE;
                    const upperIndex: number = lowerIndex + this.CY_ADDING_ELEMENTS_BATCH_SIZE;
                    const arr = this.loadingNodes.slice(lowerIndex, upperIndex);
                    const card = arr.length;
                    this.cy.add(arr);
                });
            }

            this.cy.ready(() => {

                const numberOfEdges = this.loadingEdges.length;
                if (numberOfNodes > 0) {

                    // adding edges
                    numberOfChunks = Math.ceil(numberOfEdges / this.CY_ADDING_ELEMENTS_BATCH_SIZE);
                    for (let i = 0; i < numberOfChunks; i++) {
                        this.cy.batch(() => {
                            const lowerIndex: number = i * this.CY_ADDING_ELEMENTS_BATCH_SIZE;
                            const upperIndex: number = lowerIndex + this.CY_ADDING_ELEMENTS_BATCH_SIZE;
                            this.cy.add(this.loadingEdges.slice(lowerIndex, upperIndex));
                        });
                    }
                }

                this.newDatasetToPropagate = true;

                // selecting new entered nodes
                if (selectEnteringNodes) {

                    const newEnteringElementsIds = this.loadingNodes.map((elem) => {
                        return elem.data.id;
                    });

                    // selecting just the new entering elements
                    this.selectOnlyEnteringElements(newEnteringElementsIds);
                }
            });
        }

        this.loadingNodes = [];
        this.loadingEdges = [];
    }

    /**
     * It checks and then:
     * - adds a candidate new entering style class if not already present
     * - else it ignores the candidate style class but it performs some checks about the linear size.
     *
     * Eventually it cleans up the entering styles collection.
     */
    addCandidateStyleClassSelectors(newCandidateStyleClassSelectors: Object[]) {

        const currentJsonStyle: Object[] = this.getCytoscapeStyleClasses();

        /*
         * removinf from the starting candidate styles the following selectors
         * that will be added again from the new candidate style classes:
         * - node:selected
         * - eh-source
         * - eh-target
         * - eh-preview
         * - eh-preview-active
         * - eh-ghost-edge
         */
        for (let i = 0; i < currentJsonStyle.length; i++) {
            const classStyle = currentJsonStyle[i];
            const selector = classStyle['selector'];
            if (selector === 'node:selected' || (selector.startsWith('.eh-') && selector !== '.eh-handle')) {
                currentJsonStyle.splice(i, 1);
                i--;
            }
        }

        // adding the new elements to the current set of styles
        for (const currentStyle of newCandidateStyleClassSelectors) {

            // current style added iff not already contained in cytoscape's style classes
            const alreadyContainedClassStyle = this.getClassStyleBySelector(currentStyle['selector'], currentJsonStyle);
            if (!alreadyContainedClassStyle) {
                currentJsonStyle.push(currentStyle);
            } else { // check

                // if already present style has linear size data, then we prepare/update the mapping data function
                if (alreadyContainedClassStyle['style']['width'] &&
                    alreadyContainedClassStyle['style']['width'].indexOf('mapData') >= 0) {
                    const selector = alreadyContainedClassStyle['selector'];
                    const elements = this.cy.$(selector);
                    if (elements.length > 0) {
                        this.prepareMapDataFunction(alreadyContainedClassStyle['style'], selector);

                        // update width and height of saved class
                        const className = this.getClassInfoFromSelector(alreadyContainedClassStyle['selector'])['name'];
                        const classType = this.getClassInfoFromSelector(alreadyContainedClassStyle['selector'])['type'];
                        if (classType === 'node') {
                            this.getNodeStyleClassByClassName(className)['settings']['shapeWidth'] = alreadyContainedClassStyle['style']['width'];
                            this.getNodeStyleClassByClassName(className)['settings']['shapeHeight'] = alreadyContainedClassStyle['style']['height'];
                        } else if (classType === 'edge') {
                            this.getEdgeStyleClassByClassName(className)['settings']['shapeWidth'] = alreadyContainedClassStyle['style']['width'];
                        }
                    }
                }
            }
        }

        // cy bug fix (percentage omitted): updating background fields if present with percentage values
        for (const currentStyle of currentJsonStyle) {
            if (currentStyle['style']['background-width'] && currentStyle['style']['background-height']) {
                currentStyle['style']['background-width'] = '70%';
                currentStyle['style']['background-height'] = '70%';
            }
        }

        // setting the new styles' set
        this.cy.style().fromJson(currentJsonStyle).update(); // update the elements in the graph with the new style

        this.loadingStyleClassSelectors = [];
    }

    // auxiliary function
    getClassStyleBySelector(selector: string, classStyles: Object[]) {
        for (const classStyle of classStyles) {
            if (classStyle['selector'] === selector) {
                return classStyle;
            }
        }
        return undefined;
    }

    /**
     * Layouts
     */

    getGraphSpacing() {
        let spacing = this.graphSpacing !== undefined ? this.graphSpacing : 0.085;
        if (spacing < 0) {
            spacing = 0;
        }
        return spacing;
    }

    startLayout(layout, layoutName, updateLastLayout?: boolean) {
        // saving the reference to the current layout, in this way we can interact with it also during the execution
        this.currentRunningLayout = layout;

        if (updateLastLayout) {
            this.lastLayoutName = layoutName;
        }

        this.cy.$('edge').addClass('invisible');
        layout.pon('layoutstop').then((event) => {
            // rendering again all the edges
            this.cy.$('edge').removeClass('invisible');

            // removing the reference to the current layout
            this.currentRunningLayout = undefined;

            // clearing the timeout
            clearTimeout(this.runningLayoutTimeout);
        });

        this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
                layout.run();
            }, 100);
        });

        this.runningLayoutTimeout = this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
                if (this.currentRunningLayout) {
                    this.stopRunningLayout();
                    console.log('Layout was stopped during its execution to observe the input timeout threshold.');
                }
            }, this.runningLayoutTimeThreshold * 1000);
        });

    }

    applyLastLayout(animationSpeed?: number, options?: Object) {

        // disabling the handles if enabled
        this.cyEdgehandles.disable();

        if (this.cy) {
            if (this.cy.elements().length > 0) {
                if (this.lastLayoutName != null && this.cy.elements().length > 0) {

                    // making the spinner start
                    this.startSpinner();

                    if (this.lastLayoutName === 'breadthfirstCircle') {
                        this.graphApplyLayoutBreadthFirst(true, false, true);
                    } else if (this.lastLayoutName === 'breadthfirstTree') {
                        this.graphApplyLayoutBreadthFirst(false, false, true);
                    } else if (this.lastLayoutName === 'cola') {
                        this.graphApplyLayoutCola(animationSpeed);
                    } else if (this.lastLayoutName === 'dagre') {
                        this.graphApplyLayoutDagre(animationSpeed);
                    } else if (this.lastLayoutName === 'concentric') {
                        this.graphApplyLayoutConcentric(animationSpeed);
                    } else if (this.lastLayoutName === 'circle') {
                        this.graphApplyLayoutCircle(animationSpeed, options);
                    } else if (this.lastLayoutName === 'grid') {
                        this.graphApplyLayoutGrid(animationSpeed);
                    } else if (this.lastLayoutName === 'random') {
                        this.graphApplyLayoutRandom(animationSpeed);
                    } else if (this.lastLayoutName === 'preset') {
                        this.graphApplyLayoutPreset(true);
                    } else if (this.lastLayoutName === 'force') {
                        this.stopSpinner();
                        this.vivaGraphLayout();
                    } else if (this.lastLayoutName === 'spring') {
                        this.serverSideLayout('spring');
                    } else if (this.lastLayoutName === 'dag') {
                        this.serverSideLayout('DAG');
                    }
                }
            } else {
                this.notificationService.push('warning', 'Layout', 'There are no elements in the widget to apply the selected layout on.');
            }
        } else {
            this.notificationService.push('warning', 'Layout', 'Load some data before you apply a layout.');
        }
    }

    vivaGraphLayout() {

        this.currentRunningLayout = { layout: 'vivagraph-layout' };

        const edges = this.cy.edges().jsons();
        const nodes = this.cy.nodes().jsons();
        this.cy.edges().remove();
        this.cy.nodes().remove();

        const graph = Viva.Graph.graph();
        // adding nodes
        for (const currCyNode of nodes) {
            const currCyNodeJson = currCyNode;
            const currClass = currCyNodeJson['data']['class'];
            let widthValue: string = this.getNodeStyleClassByClassName(currClass)['settings']['shapeWidth'].replace('px', '');
            let heightValue: string = this.getNodeStyleClassByClassName(currClass)['settings']['shapeHeight'].replace('px', '');
            if (widthValue.indexOf('mapData') >= 0) {
                widthValue = '30';
            }
            if (heightValue.indexOf('mapData') >= 0) {
                heightValue = '30';
            }
            const width: number = parseInt(widthValue, 10);
            const height: number = parseInt(heightValue, 10);
            let currSize: number;
            if (width >= height) {
                currSize = width;
            } else {
                currSize = height;
            }
            const currColor: number = parseInt(this.getNodeStyleClassByClassName(currClass)['settings']['shapeColor'].replace('#', '0x'), 16);

            const node = graph.addNode(currCyNode['data']['id'], {
                type: 'node',
                initialPos: { x: currCyNode['position']['x'], y: currCyNode['position']['y'] },
                size: currSize,
                color: currColor
            });

            // settin starting positions with the initial position contained in node.data
            node.position = node.data.initialPos;
        }

        // adding edges
        for (const currCyEdge of edges) {
            const currCyEdgeData = currCyEdge;
            graph.addLink(currCyEdgeData['data']['source'], currCyEdgeData['data']['target'], { type: 'edge' });
        }

        // Graphics
        const graphics = Viva.Graph.View.webglGraphics();

        // first, tell webgl graphics we want to use custom shader
        // to render nodes:
        const circleNode = buildCircleNodeShader();
        graphics.setNodeProgram(circleNode);

        const forceLayout = Viva.Graph.Layout.forceDirected(graph, {
            springLength: this.springLength,
            springCoeff: this.springCoeff,
            dragCoeff: this.dragCoeff,
            gravity: this.gravity,
            theta: this.theta
        });

        graphics.node((node) => {
            // The function is called every time renderer needs a ui to display node
            return new WebglCircle(node.data.size, node.data.color);
        });

        const container = $('#cy_' + this.widgetId).get(0);

        const pan = this.cy.pan();
        const currentZoomLevel = this.cy.zoom();
        const transform = {
            offsetX: pan.x,
            offsetY: pan.y,
            scale: currentZoomLevel
        };
        const renderer = Viva.Graph.View.renderer(graph, {
            container: container,
            interactive: 'scroll drag node',
            graphics: graphics,
            layout: forceLayout,
            transform: transform
        });
        renderer.run();

        // force layout stop in not completed yet before the tme threshold
        this.runningVivagraphLayoutTimeout = this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
                const event = new CustomEvent('layout-stop');
                this.runningVivagraphLayoutTimeout = undefined;
                container.dispatchEvent(event);
            }, 1000 * this.runningLayoutTimeThreshold);
        });

        const onLayoutStop = (event) => {

            container.removeEventListener('layout-stop', onLayoutStop, true);

            renderer.pause();
            if (!this.runningVivagraphLayoutTimeout) {
                console.log('Layout was stopped during its execution to observe the input timeout threshold.');
            } else {
                clearTimeout(this.runningVivagraphLayoutTimeout);
                this.runningVivagraphLayoutTimeout = undefined;
                console.log('Layout completed its execution.');
            }

            this.cy.batch(() => {
                nodes.forEach((node) => {
                    const newPosition = forceLayout.getNodePosition(node['data']['id']);
                    node['position'] = newPosition;
                });
            });

            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.fitAndCenterViewport();
                }, 100);
            });

            console.log('Stopping VivaGraphJS rendering...');
            renderer.dispose();
            graph.clear();
            console.log('VivaGraphJS Rendering stopped.');

            // adding elements back

            // adding nodes
            let numberOfChunks = Math.ceil(nodes.length / this.CY_ADDING_ELEMENTS_BATCH_SIZE);
            for (let i = 0; i < numberOfChunks; i++) {
                this.cy.batch(() => {
                    const lowerIndex: number = i * this.CY_ADDING_ELEMENTS_BATCH_SIZE;
                    const upperIndex: number = lowerIndex + this.CY_ADDING_ELEMENTS_BATCH_SIZE;
                    const arr = nodes.slice(lowerIndex, upperIndex);
                    this.cy.add(arr);
                });
            }

            // adding edges
            numberOfChunks = Math.ceil(edges.length / this.CY_ADDING_ELEMENTS_BATCH_SIZE);
            for (let i = 0; i < numberOfChunks; i++) {
                this.cy.batch(() => {
                    const lowerIndex: number = i * this.CY_ADDING_ELEMENTS_BATCH_SIZE;
                    const upperIndex: number = lowerIndex + this.CY_ADDING_ELEMENTS_BATCH_SIZE;
                    const arr = edges.slice(lowerIndex, upperIndex);
                    this.cy.add(arr);
                });
            }

            this.currentRunningLayout = undefined;
        };

        // Listen to your custom event
        container.addEventListener('layout-stop', onLayoutStop, true);

        function WebglCircle(size, color) {
            this.size = size;
            this.color = color;
        }

        // Next comes the hard part - implementation of API for custom shader
        // program, used by webgl renderer:
        function buildCircleNodeShader() {
            // For each primitive we need 4 attributes: x, y, color and size.
            const ATTRIBUTES_PER_PRIMITIVE = 4,
                nodesFS = [
                    'precision mediump float;',
                    'varying vec4 color;',
                    'void main(void) {',
                    '   if ((gl_PointCoord.x - 0.5) * (gl_PointCoord.x - 0.5) + (gl_PointCoord.y - 0.5) * (gl_PointCoord.y - 0.5) < 0.25) {',
                    '     gl_FragColor = color;',
                    '   } else {',
                    '     gl_FragColor = vec4(0);',
                    '   }',
                    '}'].join('\n'),
                nodesVS = [
                    'attribute vec2 a_vertexPos;',
                    // Pack color and size into vector. First elemnt is color, second - size.
                    // Since it's floating point we can only use 24 bit to pack colors...
                    // thus alpha channel is dropped, and is always assumed to be 1.
                    'attribute vec2 a_customAttributes;',
                    'uniform vec2 u_screenSize;',
                    'uniform mat4 u_transform;',
                    'varying vec4 color;',
                    'void main(void) {',
                    '   gl_Position = u_transform * vec4(a_vertexPos/u_screenSize, 0, 1);',
                    '   gl_PointSize = a_customAttributes[1] * u_transform[0][0];',
                    '   float c = a_customAttributes[0];',
                    '   color.b = mod(c, 256.0); c = floor(c/256.0);',
                    '   color.g = mod(c, 256.0); c = floor(c/256.0);',
                    '   color.r = mod(c, 256.0); c = floor(c/256.0); color /= 255.0;',
                    '   color.a = 1.0;',
                    '}'].join('\n');
            let program,
                gl,
                buffer,
                locations,
                // utils, never used?
                nodes = new Float32Array(64),
                nodesCount = 0,
                canvasWidth, canvasHeight, transform,
                isCanvasDirty,
                webglUtils;
            return {
                /**
                 * Called by webgl renderer to load the shader into gl context.
                 */
                load: function(glContext) {
                    gl = glContext;
                    webglUtils = Viva.Graph.webgl(glContext);
                    program = webglUtils.createProgram(nodesVS, nodesFS);
                    gl.useProgram(program);
                    locations = webglUtils.getLocations(program, ['a_vertexPos', 'a_customAttributes', 'u_screenSize', 'u_transform']);
                    gl.enableVertexAttribArray(locations.vertexPos);
                    gl.enableVertexAttribArray(locations.customAttributes);
                    buffer = gl.createBuffer();
                },
                /**
                 * Called by webgl renderer to update node position in the buffer array
                 *
                 * @param nodeUI - data model for the rendered node (WebGLCircle in this case)
                 * @param pos - {x, y} coordinates of the node.
                 */
                position: function(nodeUI, pos) {
                    const idx = nodeUI.id;
                    nodes[idx * ATTRIBUTES_PER_PRIMITIVE] = pos.x;
                    nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 1] = -pos.y;
                    nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 2] = nodeUI.color;
                    nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 3] = nodeUI.size;
                },
                /**
                 * Request from webgl renderer to actually draw our stuff into the
                 * gl context. This is the core of our shader.
                 */
                render: function() {
                    gl.useProgram(program);
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, nodes, gl.DYNAMIC_DRAW);
                    if (isCanvasDirty) {
                        isCanvasDirty = false;
                        gl.uniformMatrix4fv(locations.transform, false, transform);
                        gl.uniform2f(locations.screenSize, canvasWidth, canvasHeight);
                    }
                    gl.vertexAttribPointer(locations.vertexPos, 2, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 0);
                    gl.vertexAttribPointer(locations.customAttributes, 2, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 2 * 4);
                    gl.drawArrays(gl.POINTS, 0, nodesCount);
                },
                /**
                 * Called by webgl renderer when user scales/pans the canvas with nodes.
                 */
                updateTransform: function(newTransform) {
                    transform = newTransform;
                    isCanvasDirty = true;
                },
                /**
                 * Called by webgl renderer when user resizes the canvas with nodes.
                 */
                updateSize: function(newCanvasWidth, newCanvasHeight) {
                    canvasWidth = newCanvasWidth;
                    canvasHeight = newCanvasHeight;
                    isCanvasDirty = true;
                },
                /**
                 * Called by webgl renderer to notify us that the new node was created in the graph
                 */
                createNode: function(node) {
                    nodes = webglUtils.extendArray(nodes, nodesCount, ATTRIBUTES_PER_PRIMITIVE);
                    nodesCount += 1;
                },
                /**
                 * Called by webgl renderer to notify us that the node was removed from the graph
                 */
                removeNode: function(node) {
                    if (nodesCount > 0) { nodesCount -= 1; }
                    if (node.id < nodesCount && nodesCount > 0) {
                        // we do not really delete anything from the buffer.
                        // Instead we swap deleted node with the "last" node in the
                        // buffer and decrease marker of the "last" node. Gives nice O(1)
                        // performance, but make code slightly harder than it could be:
                        webglUtils.copyArrayPart(nodes, node.id * ATTRIBUTES_PER_PRIMITIVE, nodesCount * ATTRIBUTES_PER_PRIMITIVE, ATTRIBUTES_PER_PRIMITIVE);
                    }
                },
                /**
                 * This method is called by webgl renderer when it changes parts of its
                 * buffers. We don't use it here, but it's needed by API (see the comment
                 * in the removeNode() method)
                 */
                replaceProperties: function(replacedNode, newNode) {
                    // console.log('Replacing node props...');
                },
            };
        }
    }

    serverSideLayout(layoutType: string) {
        const selected = this.cy.$(':selected');
        const json = this.cy.json();
        if (selected.length > 0) {
            for (let n = 0; n < json.elements.nodes.length; ++n) {
                json.elements.nodes[n].lock = !this.cy.$('#' + json.elements.nodes[n].data.id).selected();
            }
        }

        const container = this.cy.container();
        const viewportSize = {
            height: container.clientHeight,
            width: container.clientWidth
        };
        json['graphSpacing'] = this.graphSpacing;
        json['maxLayoutTime'] = this.runningLayoutTimeThreshold;
        json['viewportSize'] = viewportSize; // LEAVE THIS AS LAST ITEM TO OPTIMIZE SERVER SIDE JSON PARSER
        const jsonContent = JSON.stringify(json);

        if (layoutType === 'force') {
            let graphSpacing = this.graphSpacing;
            graphSpacing = graphSpacing / 10;
            if (graphSpacing < 0.085) {
                graphSpacing = 0.085;
            }
            json['graphSpacing'] = graphSpacing;
        }

        this.widgetService.layout(layoutType, jsonContent).subscribe((snapshot: Object) => {

            this.stopSpinner();
            this.updateCytoscapeFromLayout(snapshot);

        }, (error: HttpErrorResponse) => {
            this.stopSpinner();
            this.handleError(error.error, 'Server side layout');
        });

        // updating to-save flag
        this.toSave = true;
    }

    stopRunningLayout() {
        if (this.currentRunningLayout) {
            if (this.lastLayoutName === 'force') {
                // stop the force layout performed with vivagraph by triggering a 'layout-stop' event
                const event = new CustomEvent('layout-stop');
                this.runningLayoutTimeout = undefined;
                const container = $('#cy_' + this.widgetId).get(0);
                container.dispatchEvent(event);
            } else {
                this.currentRunningLayout.stop();
            }
        }

        this.stopSpinner();
    }

    graphApplyLayoutBreadthFirst(circle: boolean, rootIsSelected: boolean, animation: boolean, filteringFunction?, animationSpeed?: number) {

        const graphSpacing: number = this.getGraphSpacing();
        let animate;
        if (animation === undefined) {
            animate = this.cy.edges().length < this.GRAPH_MAX_EDGES_ANIMATION;
        } else {
            animate = animation;
        }
        if (animationSpeed === undefined) {
            animationSpeed = this.GRAPH_DEFAULT_ANIMATION_SPEED;
        }
        const options = {
            name: 'breadthfirst',
            fit: true, // whether to fit the viewport to the graph
            directed: false, // whether the tree is directed downwards (or edges can point in any direction if false)
            padding: 50, // padding on fit !!! try 30 !!!
            circle: circle, // put depths in concentric circles if true, put depths top down if false
            spacingFactor: graphSpacing, // positive spacing factor, larger => more space between nodes (N.B. n/a if causes overlap)
            nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
            boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
            avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
            roots: undefined, // the roots of the trees
            maximalAdjustments: 0, // how many times to try to position the nodes in a maximal way (i.e. no backtracking)
            animate: animate, // whether to transition the node positions
            animationDuration: animationSpeed, // duration of animation in ms if enabled
            animateFilter: function(node, i) { return true; },
            transform: function(node, position) { return position; },
            stop: () => {
                // unlock all the elements if any, in case the layout was called on a subset of element
                // (e.g. just on enetering nodes after a query)
                this.cy.elements().unlock();
                this.stopSpinner();
            }
        };

        if (rootIsSelected) {
            const elements = this.cy.$(':selected');
            if (elements.length === 1) {
                // USE THE SELECTION AS ROOT
                options.roots = elements;
            }
        }

        const layout = this.cy.elements().makeLayout(options);
        this.startLayout(layout, options.name + (circle ? 'Circle' : 'Tree'));
    }

    graphApplyLayoutCola(animationSpeed?: number) {

        const graphSpacing: number = this.getGraphSpacing();
        const animate = this.cy.edges().length < this.GRAPH_MAX_EDGES_ANIMATION;

        if (animationSpeed === undefined) {
            animationSpeed = this.GRAPH_DEFAULT_ANIMATION_SPEED;
        }
        const layout = this.cy.elements().makeLayout({
            name: 'cola',
            animate: animate, // whether to show the layout as it's running
            maxSimulationTime: animationSpeed, // duration of animation in ms if enabled
            refresh: 1, // number of ticks per frame; higher is faster but more jerky
            ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
            fit: true, // on every layout reposition of nodes, fit the viewport
            padding: 3, // padding around the simulation
            boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }

            // layout event callbacks
            ready: function() { }, // on layoutready
            stop: () => {
                // unlock all the elements if any, in case the layout was called on a subset of element
                // (e.g. just on enetering nodes after a query)
                this.cy.elements().unlock();
                this.stopSpinner();
            },

            // positioning options
            randomize: false, // use random node positions at beginning of layout
            avoidOverlap: true, // if true, prevents overlap of node bounding boxes
            handleDisconnected: true, // if true, avoids disconnected components from overlapping
            nodeSpacing: graphSpacing, // extra spacing around nodes
            flow: undefined, // use DAG/tree flow layout if specified, e.g. { axis: 'y', minSeparation: 30 }
            alignment: undefined, // relative alignment constraints on nodes, e.g. function( node ){ return { x: 0, y: 1 } }

            // different methods of specifying edge length
            // each can be a constant numerical value or a function like `function( edge ){ return 2; }`
            edgeLength: undefined, // sets edge length directly in simulation
            edgeSymDiffLength: undefined, // symmetric diff edge length in simulation
            edgeJaccardLength: undefined, // jaccard edge length in simulation

            // iterations of cola algorithm; uses default values on undefined
            unconstrIter: undefined, // unconstrained initial layout iterations
            userConstIter: undefined, // initial layout iterations with user-specified constraints
            allConstIter: undefined, // initial layout iterations with all constraints including non-overlap

            // infinite layout options
            infinite: false // overrides all other options for a forces-all-the-time mode
        });

        this.startLayout(layout, 'cola');
    }

    graphApplyLayoutDagre(animationSpeed?: number) {

        const graphSpacing: number = this.getGraphSpacing();
        const animate = this.cy.edges().length < this.GRAPH_MAX_EDGES_ANIMATION;

        if (animationSpeed === undefined) {
            animationSpeed = this.GRAPH_DEFAULT_ANIMATION_SPEED;
        }
        const layout = this.cy.elements().makeLayout({
            name: 'dagre',
            animate: animate, // whether to show the layout as it's running
            animationDuration: animationSpeed, // duration of animation in ms if enabled
            // dagre algo options, uses default value on undefined
            nodeSep: undefined, // the separation between adjacent nodes in the same rank
            edgeSep: undefined, // the separation between adjacent edges in the same rank
            rankSep: undefined, // the separation between adjacent nodes in the same rank
            rankDir: 'BT', // 'TB' for top to bottom flow, 'LR' for left to right
            minLen: function(edge) { return 1; }, // number of ranks to keep between the source and target of the edge
            edgeWeight: function(edge) { return 1; }, // higher weight edges are generally made shorter and straighter than lower weight edges

            // general layout options
            fit: true, // whether to fit to viewport
            padding: 3, // fit padding
            spacingFactor: graphSpacing,
            animationEasing: undefined, // easing of animation if enabled
            boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
            ready: function() { }, // on layoutready
            stop: () => {
                // unlock all the elements if any, in case the layout was called on a subset of element
                // (e.g. just on enetering nodes after a query)
                this.cy.elements().unlock();
                this.stopSpinner();
            }
        });

        this.startLayout(layout, 'dagre');
    }

    graphApplyLayoutConcentric(animationSpeed?: number) {

        const graphSpacing: number = this.getGraphSpacing();

        const animate = this.cy.edges().length < this.GRAPH_MAX_EDGES_ANIMATION;

        if (animationSpeed === undefined) {
            animationSpeed = this.GRAPH_DEFAULT_ANIMATION_SPEED;
        }
        const layout = this.cy.elements().makeLayout({
            name: 'concentric',
            concentric: function(node) { return node.degree(); },
            levelWidth: function(nodes) { return nodes.maxDegree() / 4; },
            minNodeSpacing: graphSpacing, // min spacing between outside of nodes (used for radius adjustment)
            padding: 3,
            animate: animate, // whether to show the layout as it's running
            animationDuration: animationSpeed, // duration of animation in ms if enabled
            animationEasing: undefined, // easing of animation if enabled
            ready: undefined, // callback on layoutready
            spacingFactor: graphSpacing,
            stop: () => {
                // unlock all the elements if any, in case the layout was called on a subset of element
                // (e.g. just on enetering nodes after a query)
                this.cy.elements().unlock();
                this.stopSpinner();
            }
        });

        this.startLayout(layout, 'concentric');
    }

    graphApplyLayoutCircle(animationSpeed?: number, options?: Object) {

        const graphSpacing: number = this.getGraphSpacing();
        const animate = this.cy.edges().length < this.GRAPH_MAX_EDGES_ANIMATION;

        if (animationSpeed === undefined) {
            animationSpeed = this.GRAPH_DEFAULT_ANIMATION_SPEED;
        }
        const layout = this.cy.elements().makeLayout({
            name: 'circle',
            animate: animate, // whether to show the layout as it's running
            animationDuration: animationSpeed, // duration of animation in ms if enabled
            spacingFactor: graphSpacing,
            stop: () => {
                this.stopSpinner();
                if (options && options['runForceWhenReady']) {
                    this.vivaGraphLayout();
                } else {
                    // unlock all the elements if any, in case the layout was called on a subset of element
                    // (e.g. just on entering nodes after a query)
                    this.cy.elements().unlock();
                }
            }
        });

        if (options) {
            layout['options']['radius'] = options['radius'];
            layout['options']['boundingBox'] = options['boundingBox'];
        }

        if (options && options['traversing']) {
            const updateLastLayout: boolean = !options['traversing'];
            this.startLayout(layout, 'circle', updateLastLayout);
        } else {
            this.startLayout(layout, 'circle');
        }
    }

    graphApplyLayoutGrid(animationSpeed?: number) {

        const graphSpacing: number = this.getGraphSpacing();
        const animate = this.cy.edges().length < this.GRAPH_MAX_EDGES_ANIMATION;

        if (animationSpeed === undefined) {
            animationSpeed = this.GRAPH_DEFAULT_ANIMATION_SPEED;
        }
        const layout = this.cy.elements().makeLayout({
            name: 'grid',
            animate: animate, // whether to show the layout as it's running
            animationDuration: animationSpeed, // duration of animation in ms if enabled
            spacingFactor: graphSpacing,
            stop: () => {
                // unlock all the elements if any, in case the layout was called on a subset of element
                // (e.g. just on enetering nodes after a query)
                this.cy.elements().unlock();
                this.stopSpinner();
            }
        });

        this.startLayout(layout, 'grid');
    }

    graphApplyLayoutPreset(setAsLastLayout?: boolean, animationSpeed?: number, snapshot?: Object, fit?: boolean) {

        const animate = this.cy.edges().length < this.GRAPH_MAX_EDGES_ANIMATION;

        if (animationSpeed === undefined) {
            animationSpeed = this.GRAPH_DEFAULT_ANIMATION_SPEED;
        }

        if (fit === undefined) {
            fit = true;
        }

        const layoutOptions = {
            name: 'preset',
            positions: (node) => {
                const nodePosition = this.loadingNodesPositions[node.id()];
                return nodePosition;
            },
            animate: animate, // whether to show the layout as it's running
            animationDuration: animationSpeed, // duration of animation in ms if enabled
            fit: fit,
            padding: 30,
            stop: () => {
                // unlock all the elements if any, in case the layout was called on a subset of element
                // (e.g. just on enetering nodes after a query)
                this.cy.elements().unlock();
                this.stopSpinner();
            }
        };

        if (snapshot) {
            layoutOptions['zoom'] = snapshot['zoom'];
            layoutOptions['pan'] = snapshot['pan'];
        }

        const layout = this.cy.elements().makeLayout(layoutOptions);
        this.startLayout(layout, 'preset', setAsLastLayout);
    }

    graphApplyLayoutRandom(animationSpeed?: number) {

        const graphSpacing: number = this.getGraphSpacing();
        const animate = this.cy.edges().length < this.GRAPH_MAX_EDGES_ANIMATION;

        if (animationSpeed === undefined) {
            animationSpeed = this.GRAPH_DEFAULT_ANIMATION_SPEED;
        }
        const layout = this.cy.elements().makeLayout({
            name: 'random',
            animate: animate, // whether to show the layout as it's running
            animationDuration: animationSpeed, // duration of animation in ms if enabled
            spacingFactor: graphSpacing,
            stop: () => {
                // unlock all the elements if any, in case the layout was called on a subset of element
                // (e.g. just on enetering nodes after a query)
                this.cy.elements().unlock();
                this.stopSpinner();
            }
        });

        this.startLayout(layout, 'random');
    }

    /*
    * Load from query, Load from snapshot, Traverse.
    */

    executeTraverseFromEvent(event) {
        if (this.lastLayoutName === 'force' && this.currentRunningLayout) {
            const message = 'Cannot execute a traverse while force layout is running. Please wait for layout stop.';
            this.notificationService.push('warning', 'Traverse', message);
        } else {
            const nodeIds = event['nodeIds'];
            const relationship = event['edgeClass'];
            const direction = event['direction'];
            const numberOfConnections = event['numberOfConnections'];
            this.traverseRelationshipFromNodes(nodeIds, relationship, direction, numberOfConnections);
        }
    }

    traverseAllFromSelectedNodes() {
        if (this.lastLayoutName === 'force' && this.currentRunningLayout) {
            const message = 'Cannot execute a traverse while force layout is running. Please wait for layout stop.';
            this.notificationService.push('warning', 'Traverse', message);
        } else {
            let numberOfConnections: number = 0;
            const elementsIds: string[] = this.cy.nodes().filter((elem) => {
                if (elem.selected()) {
                    numberOfConnections += elem.json()['data']['edgeCount'];
                    return true;
                }
                return false;
            }).map((elem) => {
                return elem.id();
            } );
            const nodeIds = elementsIds;
            const relationship = '';
            const direction = 'both';
            this.traverseRelationshipFromNodes(nodeIds, relationship, direction, numberOfConnections);
        }
    }

    checkCurrentLoadingConnections(numberOfConnections: number): Promise<boolean> {

        let promise = Promise.resolve(true);
        if (this.cy) {
            if (numberOfConnections > this.LOADING_CONNECTIONS_THRESHOLD) {
                const subject = new Subject<boolean>();
                promise = new Promise((resolve, reject) => {
                    this.modalRef = this.modalService.show(PerformTraverseModalComponent);
                    this.modalRef.content.subject = subject;
                    this.modalRef.content.subject.subscribe((choice) => {
                        resolve(choice);
                    });
                });
            }
        }
        return promise;
    }

    traverseRelationshipFromNodes(nodeIds: string[], relationship: string, direction: string, numberOfConnections: number, propagateNewDataset?: boolean) {

        let currentDatasetCardinality: number = 0;
        if (this.cy) {
            currentDatasetCardinality = this.cy.elements().length;
        }
        if (currentDatasetCardinality >= this.maxElementsByContract) {
            this.notificationService.push('warning', 'Dataset threshold reached', this.maxNumberOfElementsReachedAlert);
            return;
        } else {

            this.checkCurrentLoadingConnections(numberOfConnections).then((performTraverse) => {

                if (performTraverse) {

                    const json = {
                        nodeIds: nodeIds,
                        edgeClass: relationship,
                        direction: direction,
                        datasetCardinality: currentDatasetCardinality
                    };

                    const jsonContent = JSON.stringify(json);
                    this.startSpinner();
                    this.widgetService.traverseRelationshipFromNodes(this.widgetId, jsonContent).subscribe((data: Object) => {
                        this.stopSpinner();

                        // removing context menu
                        this.manuallyHideAndCleanContextMenu();

                        const resultTruncated: boolean = data['elementsTruncated'];
                        if (resultTruncated === true) {
                            const resultSize = data['maxElementsByQuery'];
                            const message: string = 'The result was truncated to ' + resultSize + ' elements.';
                            this.notificationService.push('warning', 'Query', message);
                        }

                        let t = new Date();
                        console.log('QUERY RESULT RETURNED - CY UPDATING START (' + t + ', ms: ' + t.getMilliseconds() + ')');
                        this.updateCytoscapeFromQueryData(data, true, true, json);

                        t = new Date();
                        console.log('CY UPDATING END (' + t + ', ms: ' + t.getMilliseconds() + ')');
                    }, (error: HttpErrorResponse) => {
                        this.stopSpinner();
                        this.handleError(error.error, 'Data loading');
                    });
                }
            });
        }
    }

    selectOnlyEnteringElements(newEnteringElements: Object[]) {
        const elements = this.cy.nodes().filterFn(function(ele) {
            return newEnteringElements.indexOf(ele.id()) > -1;
        });
        this.graphUnselectAll();
        this.graphSelectElements(elements);
    }

    checkCurrentNumberOfNodes(): Promise<boolean> {

        let promise = Promise.resolve(true);
        if (this.cy) {
            const currentNumberNodes = this.cy.nodes().length;
            if (currentNumberNodes > this.CURRENT_NODES_THRESHOLD) {
                const subject = new Subject<boolean>();
                promise = new Promise((resolve, reject) => {
                    this.modalRef = this.modalService.show(PerformQueryModalComponent);
                    this.modalRef.content.subject = subject;
                    this.modalRef.content.subject.subscribe((choice) => {
                        resolve(choice);
                    });
                });
            }
        }
        return promise;
    }

    loadElementsFromClasses(propagateNewDataset?: boolean) {

        // closing modal
        this.modalRef.hide();

        let currentDatasetCardinality: number = 0;
        if (this.cy) {
            currentDatasetCardinality = this.cy.elements().length;
        }
        if (currentDatasetCardinality >= this.maxElementsByContract) {
            this.notificationService.push('warning', 'Dataset threshold reached', this.maxNumberOfElementsReachedAlert);
            return;
        } else {
            this.checkCurrentNumberOfNodes().then((performQuery) => {
                if (performQuery) {
                    const json = {
                        classesNames: [this.nodeClassForNodeFetching],
                        limit: this.limitForNodeFetching,
                        datasetCardinality: currentDatasetCardinality
                    };
                    const jsonContent = JSON.stringify(json);
                    this.startSpinner();
                    this.widgetService.loadElementsFromClasses(this.widgetId, jsonContent).subscribe((data: Object) => {
                        this.stopSpinner();

                        // removing context menu
                        this.manuallyHideAndCleanContextMenu();

                        this.updateCytoscapeFromQueryData(data, false, true);

                        const resultTruncated: boolean = data['elementsTruncated'];
                        if (resultTruncated === true) {
                            const resultSize = data['maxElementsByQuery'];
                            const message: string = 'The result was truncated to ' + resultSize + ' elements.';
                            this.notificationService.push('warning', 'Query', message);
                        }
                    }, (error: HttpErrorResponse) => {
                        this.stopSpinner();
                        this.handleError(error.error, 'Data loading');
                    });
                }
            });
        }
    }

    loadDataFromCurrentQuery() {
        if (this.currentQuery) {
            this.loadDataFromQuery(this.currentQuery);
        } else {
            this.notificationService.push('error', 'Query', 'Query not correctly specified. Please check the query again.');
        }
    }

    loadDataFromQuery(query: string, propagateNewDataset?: boolean) {

        // closing modal
        this.modalRef.hide();

        let currentDatasetCardinality: number = 0;
        if (this.cy) {
            currentDatasetCardinality = this.cy.elements().length;
        }
        if (currentDatasetCardinality >= this.maxElementsByContract) {
            this.notificationService.push('warning', 'Dataset threshold reached', this.maxNumberOfElementsReachedAlert);
            return;
        } else {
            this.checkCurrentNumberOfNodes().then((performQuery) => {
                if (performQuery) {
                    const json = {
                        query: query,
                        datasetCardinality: currentDatasetCardinality
                    };
                    const jsonContent = JSON.stringify(json);
                    this.startSpinner();
                    this.widgetService.loadDataFromQuery(this.widgetId, jsonContent).subscribe((data: Object) => {
                        this.stopSpinner();

                        // removing context menu
                        this.manuallyHideAndCleanContextMenu();

                        this.updateCytoscapeFromQueryData(data, false, true);

                        const resultTruncated: boolean = data['elementsTruncated'];
                        if (resultTruncated === true) {
                            const resultSize = data['maxElementsByQuery'];
                            const message: string = 'The result was truncated to ' + resultSize + ' elements.';
                            this.notificationService.push('warning', 'Query', message);
                        }
                    }, (error: HttpErrorResponse) => {
                        this.stopSpinner();
                        this.handleError(error.error, 'Data loading');
                    });
                }
            });
        }
    }

    /**
     * Used by full text search, as an api is still missing.
     * @param query
     */
    loadNodesFromIds(nodeIds: string[], propagateNewDataset?: boolean) {

        let currentDatasetCardinality: number = 0;
        if (this.cy) {
            currentDatasetCardinality = this.cy.elements().length;
        }
        if (currentDatasetCardinality >= this.maxElementsByContract) {
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
                this.updateCytoscapeFromQueryData(data, false, true);
                this.resetFullTextSearch();
            }, (error: HttpErrorResponse) => {
                this.stopSpinner();
                this.handleError(error.error, 'Data loading');
            });
        }
    }

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
                this.handleError(error, 'Snapshot loading');
            });
        }
    }

    performSnapshotLoading(snapshot) {
        this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {

                // small timeout just to allow spinner to start, otherwise cy loading interferes with angular variable
                // update process and the spinner does not start
                this.updateCytoscapeFromSnapshot(snapshot);
                if (!this.minimizedView) {
                    this.updateFilteringMenu().subscribe(() => {
                        console.log('Filtering menu updated according to the last snapshot dataset.');
                    });
                }
                this.snapshotLoaded = true;
            }, 10);
        });
    }

    /*
    * Save/export functions, snapshot loading
    */

    // saves both data and metadata
    saveAll(hideNotification?: boolean) {

        if (this.currentRunningLayout && this.lastLayoutName === 'force') {
            // avoid the snapshot saving as cy is temporarily not available
            const message: string = 'Cannot save the widget while the force layout is running.';
            this.notificationService.push('warning', 'Save', message);
            return;
        }

        let infoNotification;
        if (!hideNotification) {
            infoNotification = this.notificationService.push('info', 'Save', 'Saving the widget...', 3000, 'fa fa-spinner fa-spin');
        }
        const delay: number = 10;

        this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {      // just to avoid the saving ops block the first notification message
                if (this.cy) {
                    const json = this.cy.json();
                    // json['style'] = this.getCytoscapeStyleClasses();  // overriding style field, in this way escape selector will be applied
                    json['nodeClasses'] = JSON.stringify(Array.from(this.nodeClassesStyles.entries()));
                    json['edgeClasses'] = JSON.stringify(Array.from(this.edgeClassesStyles.entries()));
                    json['lastLayoutName'] = this.lastLayoutName;
                    json['autoLayout'] = this.autoLayout;
                    json['spacingFactor'] = this.getGraphSpacing();
                    json['showLegend'] = this.showLegend;
                    json['timelineOptions'] = {
                        timelineInput: this.className2timelineDateInfo,
                        timelineStartDate: this.timelineStartDate.toISOString().slice(0, 10),
                        timelineEndDate: this.timelineEndDate.toISOString().slice(0, 10),
                        timelineFilteringWindowStart: this.timelineFilteringWindowStart,
                        timelineFilteringWindowEnd: this.timelineFilteringWindowEnd,
                        timelineFilteringWindowActive: this.timelineFilteringWindowActive
                    };
                    json['algorithmsConfigs'] = {
                        shortestPath: this.shortestPathConfig,
                        pageRank: this.pageRankConfig,
                        centrality: this.centralityConfig
                    };
                    json['forceLayoutParams'] = {
                        springCoeff: this.springCoeff,
                        springLength: this.springLength,
                        dragCoeff: this.dragCoeff,
                        gravity: this.gravity,
                        theta: this.theta
                    };
                    json['runningLayoutTimeThreshold'] = this.runningLayoutTimeThreshold;
                    json['showNodeLabels'] = this.showNodeLabels;
                    json['showEdgeLabels'] = this.showEdgeLabels;
                    json['nodesDegreeCanvasEnabled'] = this.nodesDegreeCanvasEnabled;
                    json['dataSourceMetadata'] = this.dataSourceMetadata;
                    json['filters'] = this.filters;
                    json['tableInputElementsCardinality'] = this.tableInputElementsCardinality;
                    json['tableInputClassNames'] = this.tableInputClassNames;
                    json['tableInputColumns'] = this.tableInputColumns;
                    json['classNameColumnIncluded'] = this.classNameColumnIncluded;

                    if (this.shortestPathSourceNode) {
                        json['shortestPathSourceNodeId'] = this.shortestPathSourceNode.id();
                    }
                    if (this.shortestPathTargetNode) {
                        json['shortestPathTargetNodeId'] = this.shortestPathTargetNode.id();
                    }
                    if (this.shortestPathSourceNodeInputLabel) {
                        json['shortestPathSourceNodeInputLabel'] = this.shortestPathSourceNodeInputLabel;
                    }
                    if (this.shortestPathTargetNodeInputLabel) {
                        json['shortestPathTargetNodeInputLabel'] = this.shortestPathTargetNodeInputLabel;
                    }

                    if (this.outputShortestPath) {
                        json['outputShortestPathIds'] = this.getElementsIds(this.outputShortestPath);
                    }

                    json['totalVertices'] = this.totalVertices;
                    json['totalEdges'] = this.totalEdges;

                    const perspective: Object = {
                        activateTimeline: this.activateTimeline,
                        tableTabActive: this.tableTabActive,
                        graphTabActive: this.graphTabActive,
                        datasourceTabActive: this.datasourceTabActive,
                        tableTabEnabled: this.tableTabEnabled
                    };
                    json['perspective'] = perspective;
                    json['newDatasetToPropagate'] = this.newDatasetToPropagate;
                    const jsonContent = JSON.stringify(json);

                    // update lastPosition according to this save in order to make the preset layout coherent
                    if (json.elements.nodes) {
                        for (const node of json.elements.nodes) {
                            this.loadingNodesPositions[node.data.id] = {
                                x: node.position.x,
                                y: node.position.y
                            };
                        }
                    }

                    this.widgetService.updateWidget(this.widgetId, jsonContent).subscribe((res: HttpResponse<any>) => {
                        if (res.status === 200 || res.status === 204) {
                            const message: string = 'Data correctly saved.';
                            if (infoNotification) {
                                this.notificationService.updateNotification(infoNotification, 'success', 'Save', message, undefined, true);
                            }

                            // updating to-save flag
                            this.toSave = false;

                            // updating snapshot-menu
                            if (this.snapshotMenu) {
                                this.snapshotMenu.loadSnapshotsNames();
                            }
                        } else {
                            const message = 'Saving attempt failed.\n' + 'Response status: ' + res.status;
                            if (infoNotification) {
                                this.notificationService.updateNotification(infoNotification, 'error', 'Save', message, undefined, true);
                            }
                        }
                    }, (error: HttpErrorResponse) => {
                        if (infoNotification) {
                            this.notificationService.updateNotification(infoNotification, 'error', 'Save', 'Saving attempt failed.', undefined, true);
                        }
                        console.log(error.message);
                    });
                } else {
                    if (infoNotification) {
                        this.notificationService.updateNotification(infoNotification, 'warning', 'Save', 'Nothing to save.', undefined, true);
                    }
                }
            }, delay);
        });
    }

    getElementsIds(elements): string[] {
        const ids: string[] = [];
        elements.forEach((elem) => {
            ids.push(elem.id());
        });
        return ids;
    }

    graphExport(content: any, exportType: string) {

        let blob = undefined;
        if (exportType === 'image/png' || exportType === 'image/jpg' || exportType === 'image/jpeg') {
            blob = this.base64Service.b64toBlob(content, exportType, 512);
        } else if (exportType === 'json') {
            blob = new Blob([JSON.stringify(content, null, 2)], { type: 'text/plain;charset=utf-8' });
        } else {
            console.log('Error: export type not supported, just "png", "jpeg/jpg" and "json" allowed.');
        }
        exportType = exportType.slice(exportType.indexOf('/') + 1);
        const fileName = this.fileName + '.' + exportType;
        fileSaver.saveAs(blob, fileName);
    }

    /**
     * Sidebar and Context Menu interactions
     */

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

        // move the context menu to the right (change the left css property)
        const contextMenu = (<any>$('#graph-widget-context-menu')).get(0);
        if (contextMenu) {
            const delta = finalSidebarSize - initialSidebarSize;
            const newLeftValue = (<any>$('#graph-widget-context-menu')).position().left + delta;
            (<any>$('#graph-widget-context-menu')).css('left', newLeftValue);
        }

        if (this.cy) {
            this.cy.resize();
        }

        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.toggleOverflowMenu();
    }

    expandSidebar() {

        const initialSidebarSize = (<any>$('.sidebar')).width();
        (<any>$('body')).removeClass('sidebar-xs');
        const finalSidebarSize = (<any>$('.sidebar')).width();

        // move the context menu to the right (change the left css property)
        const contextMenu = (<any>$('#graph-widget-context-menu')).get(0);
        if (contextMenu) {
            const delta = finalSidebarSize - initialSidebarSize;
            const newLeftValue = (<any>$('#graph-widget-context-menu')).position().left + delta;
            (<any>$('#graph-widget-context-menu')).css('left', newLeftValue);
        }

        if (this.cy) {
            this.cy.resize();
        }

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

    openGraphElementMenu() {

        // uncollapse sidebar
        if (this.sidebarCollapsed) {
            this.expandSidebar();
        }

        /*
        * Collapsing dropdown menu if activated for following sidebar menu items:
        * searchMenu, editMenu, selectionMenu, traverseMenu, graphElementMenu, dynamicFilterMenu, layoutMenu, exportMenu
        */

        // de activating other menus
        $('#traverseMenu').removeClass('active');
        $('#traverseMenu').find('ul').css('display', 'none');

        $('#searchMenu').removeClass('active');
        $('#searchMenu').find('ul').css('display', 'none');

        $('#dynamicFilterMenu').removeClass('active');
        $('#dynamicFilterMenu').find('ul').css('display', 'none');

        $('#selectionMenu').removeClass('active');
        $('#selectionMenu').find('ul').css('display', 'none');

        $('#algorithmsMenu').removeClass('active');
        $('#algorithmsMenu').find('ul').css('display', 'none');

        $('#editMenu').removeClass('active');
        $('#editMenu').find('ul').css('display', 'none');

        $('#timelineMenu').removeClass('active');
        $('#timelineMenu').find('ul').css('display', 'none');

        $('#layoutMenu').removeClass('active');
        $('#layoutMenu').find('ul').css('display', 'none');

        $('#snapshotMenu').removeClass('active');
        $('#snapshotMenu').find('ul').css('display', 'none');

        $('#exportMenu').removeClass('active');
        $('#exportMenu').find('ul').css('display', 'none');

        // activate graph element menu
        $('#graphElementMenu').addClass('active');
        $('#graphElementMenu').find('ul').css('display', 'block');

        this.activatePropertiesGraphElementMenuAccordion();
    }

    openAlgorithmsMenu() {
        // uncollapse sidebar
        if (this.sidebarCollapsed) {
            this.expandSidebar();
        }

        /*
        * Collapsing dropdown menu if activated for following sidebar menu items:
        * searchMenu, editMenu, selectionMenu, traverseMenu, graphElementMenu, dynamicFilterMenu, layoutMenu, exportMenu
        */

        // de activating other menus
        $('#graphElementMenu').removeClass('active');
        $('#graphElementMenu').find('ul').css('display', 'none');

        $('#traverseMenu').removeClass('active');
        $('#traverseMenu').find('ul').css('display', 'none');

        $('#searchMenu').removeClass('active');
        $('#searchMenu').find('ul').css('display', 'none');

        $('#dynamicFilterMenu').removeClass('active');
        $('#dynamicFilterMenu').find('ul').css('display', 'none');

        $('#selectionMenu').removeClass('active');
        $('#selectionMenu').find('ul').css('display', 'none');

        $('#editMenu').removeClass('active');
        $('#editMenu').find('ul').css('display', 'none');

        $('#timelineMenu').removeClass('active');
        $('#timelineMenu').find('ul').css('display', 'none');

        $('#layoutMenu').removeClass('active');
        $('#layoutMenu').find('ul').css('display', 'none');

        $('#snapshotMenu').removeClass('active');
        $('#snapshotMenu').find('ul').css('display', 'none');

        $('#exportMenu').removeClass('active');
        $('#exportMenu').find('ul').css('display', 'none');

        // activate graph element menu
        $('#algorithmsMenu').addClass('active');
        $('#algorithmsMenu').find('ul').css('display', 'block');
    }

    activatePropertiesGraphElementMenuAccordion() {
        if (this.vertexMenu) {
            this.vertexMenu.preparePanelForHighlighting();
        } else if (this.edgeMenu) {
            this.edgeMenu.preparePanelForHighlighting();
        }
    }

    highlightGraphElementMenu() {
        $('#graphElementMenu .panel-body').css('background-color', '#ff5c50');
        $('#graphElementMenu .panel-body').animate({
            backgroundColor: 'white'
        }, 800);
    }

    purgeContextMenuDynamicParts() {

        // removing last header if any
        const header = (<any>$('#header')).get(0);
        if (header) {
            this.contextMenuInstance.removeMenuItem('header');
        }

        // removing show/hide menu item if any
        const showHide = (<any>$('#show-hide')).get(0);
        if (showHide) {
            this.contextMenuInstance.removeMenuItem('show-hide');
        }

        // removing traverse submenu
        if (this.traverseSubmenuActivated) {
            this.removeTraverseSubmenu();
        }

    }

    addDynamicMenuItemToContextMenu(element: any) {

        // adding dynamic header
        this.addHeaderItemToContextMenu(element);

        // adding show or hide menu according to the current node state
        // this.addShowHideItemToContextMenu(element);
    }

    // dynamic menu item
    addHeaderItemToContextMenu(element: any) {

        const nodeClass: string = element['data']['class'];
        const nodeId: string = element['data']['id'];
        const menuHeader = {
            id: 'header',
            content:
                `<span id="header-content">
                        <b>` + nodeClass + `</b> &nbsp&nbsp #` + nodeId + `
                </span>
                <span id="header-close" class="fa fa-times" style="margin-left: 15px; margin-top: 2px; float: right;">
                </span>`,
            selector: 'node,edge',
            disabled: false,
            hasTrailingDivider: true
        };
        this.contextMenuInstance.insertBeforeMenuItem(menuHeader, 'content');
        const button = $('#header');
        const divId = button.attr('id');
        const divClass = button.attr('class');
        const buttonContent = button.html();
        const newDiv = button.replaceWith('<div id="' + divId + '" class="' + divClass + '">' + buttonContent + '</div>');
        $('#header-close').on('click', () => {
            this.manuallyHideAndCleanContextMenu();
        });
    }

    // static menu item
    addViewContentItemToContextMenu() {

        const contentMenuItem = {
            id: 'content',
            content:
                `<span>
                        <span class="context-menu-item-icon fa fa-list-alt"/> View Content
                    </span>`,
            tooltipText: 'View Content',
            selector: 'node,edge',
            disabled: false,
            onClickFunction: () => {
                this.openGraphElementMenu();
            },
            hasTrailingDivider: false
        };
        this.contextMenuInstance.insertBeforeMenuItem(contentMenuItem, 'delete');
    }

    // static menu item
    addShortestPathItemsToContextMenu() {

        const shortestPathFromMenuItem = {
            id: 'shortest-path-from',
            content:
                `<span>
                        <span class="context-menu-item-icon fa fa-share-alt"/> Shortest Path <b>FROM</b> here
                    </span>`,
            tooltipText: 'Shortest Path FROM here',
            selector: 'node',
            disabled: false,
            onClickFunction: (event) => {
                const node = event.target;
                this.shortestPathSourceNode = node;
                this.shortestPathSourceNodeInputLabel = this.getShortestPathNodeLabelFromNode(node, node.json()['data']['class']);
                this.manuallyHideAndCleanContextMenu();
                this.openAlgorithmsMenu();
                $('#shortestPathFrom').focus();
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        $('#shortestPathFrom').blur();
                    }, 1000);
                });
            },
            hasTrailingDivider: false
        };

        const shortestPathToMenuItem = {
            id: 'shortest-path-to',
            content:
                `<span>
                        <span class="context-menu-item-icon fa fa-share-alt"/> Shortest Path <b>TO</b> here
                    </span>`,
            tooltipText: 'Shortest Path TO here',
            selector: 'node',
            disabled: false,
            onClickFunction: (event) => {
                const node = event.target;
                this.shortestPathTargetNode = node;
                this.shortestPathTargetNodeInputLabel = this.getShortestPathNodeLabelFromNode(node, node.json()['data']['class']);
                this.manuallyHideAndCleanContextMenu();
                this.openAlgorithmsMenu();
                $('#shortestPathTo').focus();
                this.ngZone.runOutsideAngular(() => {
                    setTimeout(() => {
                        $('#shortestPathTo').blur();
                    }, 1000);
                });
            },
            hasTrailingDivider: false
        };

        this.contextMenuInstance.insertBeforeMenuItem(shortestPathFromMenuItem, 'delete');
        this.contextMenuInstance.insertBeforeMenuItem(shortestPathToMenuItem, 'delete');
    }

    // static menu item
    addTraverseItemToContextMenu() {

        const traverseMenuItem = {
            id: 'traverse',
            content:
                `<span>
                        <span class="context-menu-item-icon fa fa-arrows-alt"/> Traverse
                        <traverse-menu [nodes]="selectedNodes" (traverseRequestEmitter)="executeTraverseFromEvent($event)">
                        </traverse-menu>
                    <span/>`,
            disabled: false,
            tooltipText: 'Traverse',
            selector: 'node',
            onClickFunction: () => {
                this.toggleTraverseSubMenu();
            },
            hasTrailingDivider: false
        };
        this.contextMenuInstance.insertBeforeMenuItem(traverseMenuItem, 'hidden-footer-item');
    }

    manuallyHideAndCleanContextMenu() {

        // hide context menu
        (<any>$('#graph-widget-context-menu')).hide();

        // cleaning: removing context menu dynamic parts
        this.purgeContextMenuDynamicParts();
    }

    // dynamic menu item
    addShowHideItemToContextMenu(element: any) {

        const showHideMenu = {
            id: 'show-hide',
            selector: 'node,edge',
            disabled: false
        };

        if (element['classes'].indexOf('invisible') >= 0) {
            showHideMenu['content'] = `<span>
                                            <span class="context-menu-item-icon fa fa-eye"/> Show
                                        </span>`;
            showHideMenu['tooltipText'] = 'Show';

            showHideMenu['onClickFunction'] = (event) => {
                const node = event.target.json();
                this.showContextCommandRunning = true;
                this.graphShowElementById(node);
            };
        } else {
            showHideMenu['content'] = `<span>
                                            <span class="context-menu-item-icon fa fa-eye-slash"/> Hide
                                        </span>`;
            showHideMenu['tooltipText'] = 'Hide';
            showHideMenu['onClickFunction'] = (event) => {
                const node = event.target.json();
                this.hideContextCommandRunning = true;
                this.graphHideElementById(node);
            };
        }
        this.contextMenuInstance.insertBeforeMenuItem(showHideMenu, 'traverse');
    }

    toggleTraverseSubMenu() {

        const traverseSubmenu = (<any>$('#traverse-submenu')).get(0);
        if (traverseSubmenu) {
            // remove the traverse-submenu item
            this.removeTraverseSubmenu();
        } else {
            // add the traverse-submenu item
            this.addTraverseSubmenu();
        }
    }

    addTraverseSubmenu() {

        const contextMenuPosition = (<any>$('.cy-context-menus-cxt-menu')).position();
        // let contextMenuHeight = (<any>$('.cy-context-menus-cxt-menu')).height();

        const sidebarSize = (<any>$('.sidebar')).width();
        const deltaLeft = sidebarSize + this.widgetTableCellRightPadding + this.pageContentPadding;
        const deltaTop = -45;

        this.traverseSubmenuLeft = contextMenuPosition['left'] - deltaLeft + 'px';
        this.traverseSubmenuTop = contextMenuPosition['top'] - deltaTop + 'px';

        // adding the input nodes (just the last selected node is passed to the traverse-menu component)
        this.traverseSubmenuInputNodes = [this.lastSelectedElement];

        // enabling the traverse submenu
        this.traverseSubmenuActivated = true;

        // updating traverse menu item
        (<any>$('.cy-context-menus-cxt-menu #traverse')).addClass('traverse-submenu-button-clicked');
    }

    removeTraverseSubmenu() {
        this.traverseSubmenuActivated = false;

        // removing the input nodes
        this.traverseSubmenuInputNodes = [];

        // updating traverse menu item
        (<any>$('.cy-context-menus-cxt-menu #traverse')).removeClass('traverse-submenu-button-clicked');
    }

    /**
     * Legend
     */

    switchCollapseVertices() {
        this.graphLegendCollapsedVertices = !this.graphLegendCollapsedVertices;
        if (!this.graphLegendCollapsedVertices) {
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.tooltipOnOverflow();
                }, 10);
            });
        }
    }

    switchCollapseEdges() {
        this.graphLegendCollapsedEdges = !this.graphLegendCollapsedEdges;
        if (!this.graphLegendCollapsedEdges) {
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.tooltipOnOverflow();
                }, 10);
            });
        }
    }

    switchLegendVerticesOrder() {
        this.graphLegendVerticesOrderedByCount = !this.graphLegendVerticesOrderedByCount;
    }

    switchLegendEdgesOrder() {
        this.graphLegendEdgesOrderedByCount = !this.graphLegendEdgesOrderedByCount;
    }

    graphUpdateLegend() {

        /*
         * Recount
         */

        // reset counters
        this.totalLoadedVertices = 0;
        this.totalLoadedEdges = 0;

        // counting total number of vertices and edges
        for (const className of this.nodeClassesNames) {
            const elements = this.cy.$('node.' + this.escapeSelector(className));
            const hiddenElements = elements.filter((elem) => {
                if (elem.hidden()) {
                    return true;
                }
                return false;
            });
            const numberOfHiddenElements = hiddenElements.length;
            const partialCount = elements.length - numberOfHiddenElements;
            const currNodeClassStyle = this.getNodeStyleClassByClassName(className);
            currNodeClassStyle['count'] = partialCount;
            currNodeClassStyle['selected'] = 0;
            currNodeClassStyle['hidden'] = numberOfHiddenElements;
            this.totalLoadedVertices += partialCount;
        }
        for (const className of this.edgeClassesNames) {
            const elements = this.cy.$('edge.' + this.escapeSelector(className));
            const hiddenElements = elements.filter((elem) => {
                if (elem.hidden()) {
                    return true;
                }
                return false;
            });
            const numberOfHiddenElements = hiddenElements.length;
            const partialCount = elements.length - numberOfHiddenElements;
            const currEdgeClassStyle = this.getEdgeStyleClassByClassName(className);
            currEdgeClassStyle['count'] = partialCount;
            currEdgeClassStyle['selected'] = 0;
            currEdgeClassStyle['hidden'] = numberOfHiddenElements;
            this.totalLoadedEdges += partialCount;
        }

        this.triggerLegendPipesUpdate();
    }

    /*
     * It triggers the legend's pipes update
     * (class styles map are params for the pipe, changing the reference the pipe is triggered)
     */
    triggerLegendPipesUpdate() {
        this.nodeClassesStyles = new Map(this.nodeClassesStyles);
        this.edgeClassesStyles = new Map(this.edgeClassesStyles);
        this.dataSourceMetadata = JSON.parse(JSON.stringify(this.dataSourceMetadata));
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

        // Opening the graph element menu (the first item) expanded by default.
        // In this way a nooby user will see immediately something changing when he will click an element in the graph.
        this.openGraphElementMenu();
    }

    dashboardResetMenuItem(element) {
        // Add 'active' class to parent list item in all levels
        $(element).find('li.active').parents('li').addClass('active');

        // Hide all nested lists
        $(element).find('li').not('.active').has('ul').children('ul').addClass('hidden-ul');

        // Highlight children links
        $(element).find('li').has('ul').children('a').addClass('has-ul');

        $('.navigation-main').find('li').has('ul').children('a').unbind('click');
        $('.navigation-main').find('li').has('ul').children('a').on('click', function(e) {
            e.preventDefault();

            // Collapsible
            $(this)
                .parent('li')
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
    }
}
