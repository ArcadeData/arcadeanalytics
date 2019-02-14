import { Component, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';

import { Dashboard } from './dashboard.model';
import { DashboardService } from './dashboard.service';
import { WidgetService } from '../widget/widget.service';
import { WidgetEventBusService } from '../../shared';

import { DragulaService } from 'ng2-dragula';

import * as $ from 'jquery';
import { NotificationService } from '../../shared/services/notification.service';
import { Principal } from '../../shared/auth/principal.service';
import { Widget, MessageType, EmbedResourceModalComponent, ShareableResourceType } from '../widget';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

declare var CKEDITOR: any;

@Component({
    selector: 'jhi-dashboard-detail',
    templateUrl: './dashboard-detail.component.html',
    styleUrls: ['./dashboard-detail.component.scss'],
})
export class DashboardDetailComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {

    @Input() embedded: boolean = this.embedded ? this.embedded : false;
    dashboard: Dashboard;

    subscription: Subscription;
    dragendSubscription: Subscription;
    dashboardListModEventSubscribption: Subscription;
    widgetListModEventSubscribption: Subscription;
    dashboardSharingStatusUpdateSubscribption: Subscription;

    // widget communication
    newWidgetConnectionSubscription: Subscription;
    widgetConnectionRemovedSubscription: Subscription;
    primaryWidget2secondaryWidgets: Object = {};

    isCollapsed: boolean = false;
    isShowInfoCollapsed: boolean = true;
    panelStyleAdded: boolean = false;
    panelInitialResizingActivated: boolean = false;
    widgetsRetrieved: boolean = false;
    showFullSideMenu: boolean = true;
    differ: any;

    alreadySavingDashboardMessage: boolean = false;

    // styles and widgets sizing
    panelHeadingHeight: string = '40px';
    widgetContainerPadding: string = '5px';
    widgetContainerPaddingNum: number;
    doublePadding: number;
    widgetsContainerWidth;
    gridStepValue;
    gridStep2size: Object;
    heightsForCloseness: number[];  // this array contains all the height fexed values; everytime a widget is resized it is ordered by closeness
    // to the current new height size. In this way we can get the closest fixed height and set it as new actual widget height.
    minimumWidth;
    maximumWidth;
    minimumHeight;
    maximumHeight;
    defaultWidgetHeight: number;

    modalRef: BsModalRef;

    public collapsed(event: any): void {
        console.log(event);
    }

    public expanded(event: any): void {
        console.log(event);
    }

    change() {
        this.isCollapsed = !this.isCollapsed;
    }

    constructor(
        private eventManager: JhiEventManager,
        private dashboardService: DashboardService,
        private dragulaService: DragulaService,
        private principal: Principal,
        private widgetService: WidgetService,
        private notificationService: NotificationService,
        private route: ActivatedRoute,
        protected modalService: BsModalService,
        protected widgetEventBusService: WidgetEventBusService) {

    }

    ngOnInit() {
        // this.redirectEventEmitted = false;
        this.subscription = this.route.params.subscribe((params) => {
            this.load(params['id']);
        });
        this.registerChangeInDashboards();
        this.registerChangeInWidgets();
        this.registerSharingStatusUpdate();
        this.subscribeToEventBus();

        this.dragulaService.createGroup('bag-items', {
            revertOnSpill: true,
            moves: function(el, source, handle, sibling) {
                if (handle.id.indexOf('grab_') >= 0) {
                    return true;
                }
                return false;
            },
            direction: 'vertical'
        });

        this.dragendSubscription = this.dragulaService.dragend('bag-items').subscribe((element) => {
            this.saveDashboardWithCurrentLayout();

            // emit an event to make all the text editor reload the content, if any
            this.eventManager.broadcast({
                name: 'dragEnd',
                eventOccurred: 'dragEnd',
                description: 'Widget was dragged.'
            });
        });

    }

    ngAfterViewInit(): void {
        this.initSizesAccordingToWidgetsContainer().subscribe((completed) => {
            if (completed) {
                this.prepareWidgets();
            }
        });
    }

    prepareWidgets() {
        const presentPanels = (<any>$('.widgetContainer'));
        if (!this.panelInitialResizingActivated && presentPanels.length > 0) {
            this.enableResizingForAllWidgets();
            this.panelInitialResizingActivated = true;
        } else {
            setTimeout(() => {
                this.prepareWidgets();
            }, 50);
        }
    }

    ngAfterViewChecked() {
        if (!this.panelStyleAdded) {
            $('.panel-body').css('padding', '0px');
            this.panelStyleAdded = true;
        }
    }

    ngOnDestroy() {

        this.subscription.unsubscribe();
        this.eventManager.destroy(this.dashboardListModEventSubscribption);
        this.eventManager.destroy(this.widgetListModEventSubscribption);
        this.eventManager.destroy(this.dashboardSharingStatusUpdateSubscribption);
        this.dragulaService.destroy('bag-items');
        this.dragendSubscription.unsubscribe();

        this.unsubscribeToEventBus();
    }

    subscribeToEventBus() {
        this.newWidgetConnectionSubscription = this.widgetEventBusService.getMessage(MessageType.NEW_WIDGET_CONNECTION).subscribe((message) => {
            const primaryWidgetId = message.data['primaryWidgetId'];
            const secondaryWidgetId = message.data['secondaryWidgetId'];
            if (!this.primaryWidget2secondaryWidgets[primaryWidgetId]) {
                this.primaryWidget2secondaryWidgets[primaryWidgetId] = [];
            }
            this.primaryWidget2secondaryWidgets[primaryWidgetId].push(secondaryWidgetId);

            // // waiting till the new secondary widget is initialized, then asking to the primary widget for propagating its current dataset
            // this.requestDatasetPropagationWhenSecondaryWidgetReady(primaryWidgetId, secondaryWidgetId);

            // once ready, the secondary widget will autonomously ask the primary widget for the dataset
        });

        this.widgetConnectionRemovedSubscription = this.widgetEventBusService.getMessage(MessageType.WIDGET_CONNECTION_REMOVED).subscribe((message) => {
            const primaryWidgetId = message.data['primaryWidgetId'];
            const secondaryWidgetId = message.data['secondaryWidgetId'];
            if (this.primaryWidget2secondaryWidgets[primaryWidgetId]) {
                const secondaryWidgets: string[] = this.primaryWidget2secondaryWidgets[primaryWidgetId];
                const index = secondaryWidgets.indexOf(secondaryWidgetId + '');
                if (index > -1) {
                    secondaryWidgets.splice(index, 1);
                }
                if (secondaryWidgets.length === 0) {
                    delete this.primaryWidget2secondaryWidgets[primaryWidgetId];
                }
            }
        });
    }

    unsubscribeToEventBus() {
        this.newWidgetConnectionSubscription.unsubscribe();
        this.widgetConnectionRemovedSubscription.unsubscribe();
    }

    /**
     * Computes the correct sizing according to the widgets container actual width,
     * then returns a boolean representing if the work succeeded or not.
     */
    initSizesAccordingToWidgetsContainer(): Observable<boolean> {
        this.widgetsContainerWidth = (<any>$('#widgetsContainer')).get(0);
        if (this.widgetsContainerWidth) {
            this.widgetContainerPaddingNum = parseInt(this.widgetContainerPadding.replace('px', ''), 10);
            this.doublePadding = 2 * this.widgetContainerPaddingNum;
            this.widgetsContainerWidth = (<any>$('#widgetsContainer')).width();
            this.gridStepValue = Math.round((1 / 12) * this.widgetsContainerWidth);

            this.gridStep2size = {
                '2': (2 * this.gridStepValue) - this.doublePadding,
                '3': (3 * this.gridStepValue) - this.doublePadding,
                '4': (4 * this.gridStepValue) - this.doublePadding,
                '5': (5 * this.gridStepValue) - this.doublePadding
            };
            this.heightsForCloseness = [];
            for (const key of Object.keys(this.gridStep2size)) {
                this.heightsForCloseness.push(this.gridStep2size[key]);
            }

            this.minimumWidth = this.gridStep2size['2'] - 10;   // 10 is just a little threshold, as the minimum width is not included in the available range
            this.maximumWidth = this.widgetsContainerWidth - this.doublePadding;    // maximum accepted size is 12 columns --> widgetsContainerSize - padding
            this.minimumHeight = this.gridStep2size['2'];
            this.maximumHeight = this.gridStep2size['5'];
            this.defaultWidgetHeight = this.gridStep2size['3'];
            return Observable.of(true);
        } else {
            return Observable.timer(100).mergeMap(() => this.initSizesAccordingToWidgetsContainer());
        }
    }

    enableResizingForAllWidgets() {
        for (const widget of this.dashboard['widgets']) {
            const currentLayoutWidgetInfo = this.dashboard['layout']['widgetsLayoutInfo'].get(widget['id']);
            this.widgetActivateResizing(currentLayoutWidgetInfo['widgetId'], currentLayoutWidgetInfo['width']);
        }
    }

    emitDashboardRouteLoadedEvent(dashboardId: number) {
        this.eventManager.broadcast({
            name: 'dashboardRouteLoaded',
            dashboardId: dashboardId
        });
    }

    load(id) {
        if (!this.embedded) {
            this.dashboardService.find(id).subscribe((dashboard: Dashboard) => {
                this.dashboard = dashboard;
                this.loadDashboard();
            });
        } else {
            this.dashboardService.findForEmbeddedWidget(id).subscribe((dashboard: Dashboard) => {
                this.dashboard = dashboard;
                this.loadDashboard();
            }, (error: HttpErrorResponse) => {
                const message: string = 'The dashboard is not available as not shared anymore or removed by the owner.';
                this.notificationService.push('error', 'Widget not available', message);
            });
        }
    }

    loadDashboard() {
        // converting dashboard widgets' layout info to map, if any
        if (this.dashboard['layout']['widgetsLayoutInfo'] && this.dashboard['layout']['widgetsLayoutInfo'].length > 0) {
            this.dashboard['layout']['widgetsLayoutInfo'] = this.jsonToMap(this.dashboard['layout']['widgetsLayoutInfo']);
        }
        if (this.dashboard['layout']['primaryWidget2secondaryWidgets']) {
            this.primaryWidget2secondaryWidgets = this.dashboard['layout']['primaryWidget2secondaryWidgets'];
        }

        // emitting event
        this.emitDashboardRouteLoadedEvent(this.dashboard.id);

        this.loadConnectedWidgets();
        this.widgetsRetrieved = true;
    }

    buildDeaultLayoutInfo(widgetId: number, height) {
        const defaultLayoutOptions = {
            widgetId: widgetId,
            width: 6,
            height: height,
            collapsed: false
        };
        return defaultLayoutOptions;
    }

    loadConnectedWidgets() {
        const request = {
            page: 0,
            size: 20,
            query: ''
        };
        if (!this.embedded) {
            this.widgetService.getWidgetsByDashboardId(this.dashboard.id, request).subscribe(
                (res: HttpResponse<Widget[]>) => {
                    const retrievedWidgets = res.body;
                    this.initLoadedConnectedWidgets(retrievedWidgets);
                }, (err: HttpErrorResponse) => {
                    const message = 'Error during widgets fetching.';
                    this.notificationService.push('error', 'Widgets loading', message);
                    console.log(err.message);
                });
        } else {
            this.widgetService.getWidgetsByEmbeddedDashboardId(this.dashboard.id, request).subscribe(
                (res: HttpResponse<Widget[]>) => {
                    const retrievedWidgets = res.body;
                    this.initLoadedConnectedWidgets(retrievedWidgets);
                }, (err: HttpErrorResponse) => {
                    const message = 'Error during widgets fetching.';
                    this.notificationService.push('error', 'Widgets loading', message);
                    console.log(err.message);
                });
        }
    }

    initLoadedConnectedWidgets(retrievedWidgets: Widget[]) {

        // first default settings if it's the first loading and default order applied (maintaining retrievedWidgets order)
        if (!this.dashboard['layout']['widgetsLayoutInfo']) {

            for (const widget of retrievedWidgets) {
                this.dashboard.addWidget(widget);
            }

            for (const widget of retrievedWidgets) {
                const height: string = this.defaultWidgetHeight + 'px';
                const layout = this.buildDeaultLayoutInfo(widget.id, height);
                this.dashboard.addWidgetLayoutInfo(layout);
            }
        } else {
            // adding widgets following the layout order
            this.dashboard['layout']['widgetsLayoutInfo'].forEach((value, widgetInfoKey) => {
                for (const widget of retrievedWidgets) {
                    if (widget['id'] === widgetInfoKey) {
                        this.dashboard.addWidget(widget);
                        break;
                    }
                }
            });
        }

        // a new dashboard with new connected widgets was loaded, so we must run again jquery ui to enable panels resizing
        // we do that by setting this check variable to false so that, at the next view check, ui resizable() will be applied
        this.panelInitialResizingActivated = false;
    }

    previousState() {
        window.history.back();
    }

    registerChangeInDashboards() {
        this.dashboardListModEventSubscribption = this.eventManager.subscribe('dashboardListModification',
            (response) => {
                if (response.content === 'dashboard-upsert') {
                    this.load(response['dashboardId']);
                }
            }
        );
    }

    registerChangeInWidgets() {
        this.widgetListModEventSubscribption = this.eventManager.subscribe('widgetListModification', (response) => {

            if (response.eventOccurred === 'new-widget') {
                const height: string = this.defaultWidgetHeight + 'px';
                const defaultLayoutOptions = this.buildDeaultLayoutInfo(response.content.id, height);
                const widget = response.content;
                this.dashboard.addWidget(widget);
                if (!this.dashboard['layout']['widgetsLayoutInfo']) {
                    this.dashboard['layout']['widgetsLayoutInfo'] = new Map();
                }
                this.dashboard['layout']['widgetsLayoutInfo'].set(defaultLayoutOptions['widgetId'], defaultLayoutOptions);
                setTimeout(() => {     // waiting for the panel is rendered
                    this.widgetActivateResizing(defaultLayoutOptions['widgetId'], defaultLayoutOptions['width']);
                }, 50);

                // if the dashboard is shared, the new widget will be shared too
                if (this.dashboard['shared']) {
                    widget['shared'] = true;
                    this.widgetService.update(widget).subscribe(() => {
                        const title = 'New Widget correctly shared';
                        const message = 'The current dashboard is shareable then the new widget has been automatically opened.';
                        this.notificationService.push('success', title, message);
                    });
                }
            } else if (response.eventOccurred === 'widget-edited') {
                const editedWidget = response.content;
                const editedWidgetId = editedWidget['id'];
                this.dashboard.updateWidget(editedWidget);
                setTimeout(() => {     // waiting for the panel is rendered
                    const widgetLayout = this.dashboard['layout']['widgetsLayoutInfo'].get(editedWidgetId);
                    this.widgetActivateResizing(editedWidgetId, widgetLayout['width']);
                }, 50);
            } else if (response.eventOccurred === 'widget-removed') {
                const currentRemovingWidgetId: number = response.content;
                this.dashboard.removeWidgetById(currentRemovingWidgetId);
                this.dashboard['layout']['widgetsLayoutInfo'].delete(response.content);

                // if the current widget it's a primary widget, then delete all the connected secondary widgets
                const connectedSecondaryWidgetsIds = this.primaryWidget2secondaryWidgets[currentRemovingWidgetId];
                if (connectedSecondaryWidgetsIds && connectedSecondaryWidgetsIds.length > 0) {

                    // a primary widget was removed, then all the connected secondary widgets will be removed too

                    for (const currSecondaryWidgetId of connectedSecondaryWidgetsIds) {
                        // server side widget deleting
                        this.widgetService.delete(currSecondaryWidgetId).subscribe(() => {
                            console.log('Secondary widget correctly deleted.');
                        }, (error: HttpErrorResponse) => {
                            const err = error.error;
                            this.notificationService.push('error', 'Secondary Widget deletion failed', err['title']);
                        });
                        // deleting the widget from rhe dashboard loist
                        this.dashboard.removeWidgetById(currSecondaryWidgetId);
                    }

                    // removing all the connections
                    delete this.primaryWidget2secondaryWidgets[currentRemovingWidgetId];

                } else {

                    // a primary widget was removed, then removing the secondary widget from the primary2secondary widgets connnetions map
                    for (const primaryWidgetId of Object.keys(this.primaryWidget2secondaryWidgets)) {
                        let secondaryWidgetRemoved = false;
                        const connectedSecondaryWidgetsIds = this.primaryWidget2secondaryWidgets[primaryWidgetId];
                        for (let i = 0; i < connectedSecondaryWidgetsIds.length; i++) {
                            if (connectedSecondaryWidgetsIds && connectedSecondaryWidgetsIds.length > 0) {
                                const currSecondaryWidgetId = connectedSecondaryWidgetsIds[i];
                                if (currSecondaryWidgetId === currentRemovingWidgetId) {
                                    connectedSecondaryWidgetsIds.splice(i, 1);
                                    secondaryWidgetRemoved = true;
                                    break;
                                }
                            }
                        }
                        if (secondaryWidgetRemoved) {
                            break;
                        }
                    }
                }
            }
            this.saveDashboardWithCurrentLayout();
        });
    }

    registerSharingStatusUpdate() {
        this.dashboardSharingStatusUpdateSubscribption = this.eventManager.subscribe('dashboardSharingStatusUpdate', (response) => {
            this.saveDashboardWithCurrentLayout(response['shared']);
        });
    }

    setShowFullSideMenu(show: boolean) {
        this.showFullSideMenu = show;
    }

    updateWidgetLayoutCollapseStatus(widgetId: string, target) {

        setTimeout(() => {
            const className = target.className;
            let collapsed: boolean = false;
            if (className.indexOf('collapsed') >= 0) {
                collapsed = true;
            }

            // updating the widget layout info for the specific widget and saving
            this.dashboard['layout']['widgetsLayoutInfo'].get(widgetId)['collapsed'] = collapsed;
            this.saveDashboardWithCurrentLayout();
        }, 50);

    }

    saveDashboardWithCurrentLayout(shared?: boolean) {

        if (!this.alreadySavingDashboardMessage) {

            // setting showingSaveDashboardMessage to true in order to avoid other redundant notifications
            this.alreadySavingDashboardMessage = true;

            // saving the dashboard layout iff not reader role
            const saveAllowed: boolean = this.principal.hasAnyAuthorityDirect(['ROLE_ADMIN', 'ROLE_EDITOR']);

            if (saveAllowed) {

                const infoNotification = this.notificationService.push('info', 'Save', 'Saving the Dashboard layout...', 3000, 'fa fa-spinner fa-spin');
                const delay: number = 10;

                setTimeout(() => {
                    const dashboardCopy = JSON.parse(JSON.stringify(this.dashboard));

                    if (shared !== undefined) {
                        dashboardCopy['shared'] = shared;
                    }

                    // ordering layout infos for next loading
                    const newOrderedWidgetsLayoutInfo = new Map();
                    for (const widget of this.dashboard['widgets']) {
                        newOrderedWidgetsLayoutInfo.set(widget['id'], this.dashboard['layout']['widgetsLayoutInfo'].get(widget['id']));
                    }
                    dashboardCopy['layout']['widgetsLayoutInfo'] = this.mapToJson(newOrderedWidgetsLayoutInfo);
                    dashboardCopy['layout']['primaryWidget2secondaryWidgets'] = this.primaryWidget2secondaryWidgets;

                    // deleting widgets in dashboard
                    delete dashboardCopy['widgets'];

                    this.dashboardService.update(dashboardCopy).subscribe((res) => {
                        const message: string = 'Dashboard correctly saved.';
                        this.notificationService.updateNotification(infoNotification, 'success', 'Save', message, undefined, true);
                        this.alreadySavingDashboardMessage = false;
                    }, (err: HttpErrorResponse) => {
                        this.notificationService.updateNotification(infoNotification, 'error', 'Save', 'Saving attempt failed.', undefined, true);
                        console.log(err.message);
                        this.alreadySavingDashboardMessage = false;
                    });
                }, delay);
            }
        }
    }

    mapToJson(map) {
        const array = Array.from(map);
        return JSON.stringify(array);
    }

    jsonToMap(jsonStr) {
        return new Map(JSON.parse(jsonStr));
    }

    getWidgetById(widgetId: number) {
        for (const widget of this.dashboard['widgets']) {
            if (widget['id'] === widgetId) {
                return widget;
            }
        }
        return undefined;
    }

    enablePopovers() {
        (<any>$('[data-toggle="popover"]')).popover({
            title: '',
            placement: 'right',
            trigger: 'focus',
            html: 'true'
        });
    }

    widgetActivateResizing(widgetId, originalColumnWidth) {

        const originalPxWidth = (<any>$('#panel_' + widgetId)).width();

        (<any>$('#panel_' + widgetId)).resizable({
            grid: this.gridStepValue,
            minWidth: this.minimumWidth,
            maxWidth: this.maximumWidth,
            minHeight: this.minimumHeight,       // minimum height chosen according to the minimum width
            maxHeight: this.maximumHeight,
            handleSelector: '.panel',
            resizeWidth: true,
            resizeHeight: true,
            stop: (event, ui) => {

                const panelHeadingHeightNum: number = parseInt(this.panelHeadingHeight.replace('px', ''), 10);
                console.log('originalColumnWidth: ' + originalColumnWidth);

                // ui new size
                const newUiWidth = ui.size.width;
                const newUiHeight = ui.size.height;

                // width resizing
                const newPxWidth = newUiWidth;
                let newColumnWidth = (newPxWidth * originalColumnWidth) / originalPxWidth;  // originalPxWidth/originalColumnWidth = newPxWidth/newColumnWidth
                newColumnWidth = Math.round(newColumnWidth);
                this.dashboard['layout']['widgetsLayoutInfo'].get(widgetId)['width'] = newColumnWidth;

                // height resizing
                let newPxHeight = newUiHeight - panelHeadingHeightNum;
                newPxHeight = Math.round(newPxHeight);
                newPxHeight = this.getClosestFixedHeight(newPxHeight);
                this.dashboard['layout']['widgetsLayoutInfo'].get(widgetId)['height'] = newPxHeight + 'px';

                if (ui.originalSize.width !== ui.size.width || ui.originalSize.height !== ui.size.height) {
                    this.saveDashboardWithCurrentLayout();

                    // broadcasting the event in order to fit a center the correspondent graph widget
                    this.eventManager.broadcast({
                        name: 'dashboardPanelResized',
                        content: widgetId
                    });
                }
            }
        });
    }

    getClosestFixedHeight(targetPxHeight: number) {
        this.heightsForCloseness.sort((h1, h2) => {
            const distance1 = Math.abs(h1 - targetPxHeight);
            const distance2 = Math.abs(h2 - targetPxHeight);

            return distance1 < distance2 ? -1 : (distance1 > distance2 ? 1 : 0);
        });
        return this.heightsForCloseness[0];
    }

    openShareModal(resourceType: string, resource: Object) {

        let resourceUrl;
        if (resourceType === 'widget') {
            if (resource['hasSnapshot']) {
                resourceUrl = 'embed/widget/' + resource['uuid'] + '?type=' + resource['type'];
                this.modalRef = this.modalService.show(EmbedResourceModalComponent);
                this.modalRef.content.resourceType = ShareableResourceType.WIDGET;
                this.modalRef.content.resource = resource;
                this.modalRef.content.resourceUrl.next(resourceUrl);
            }
        } else if (resourceType === 'dashboard') {
            resourceUrl = 'embed/dashboard/' + resource['uuid'];
            this.modalRef = this.modalService.show(EmbedResourceModalComponent);
            this.modalRef.content.resourceType = ShareableResourceType.DASHBOARD;
            this.modalRef.content.resource = resource;
            this.modalRef.content.resourceUrl.next(resourceUrl);
        }
    }

}
