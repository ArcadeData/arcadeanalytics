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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { Widget, WidgetType } from './widget.model';
import { WidgetPopupService } from './widget-popup.service';
import { WidgetService } from './widget.service';
import { DataSet } from '../data-set';
import { Dashboard, DashboardService } from '../dashboard';
import { DataSource, DataSourceService } from '../data-source';
import { WidgetEventBusService, Principal } from '../../shared';
import { NotificationService } from '../../shared/services/notification.service';
import { NewWidgetConnectionMessage, NewWidgetConnectionMessageContent, MessageType } from '.';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

/**
 * Used for 'create-widget' workflow.
 */
@Component({
    selector: 'jhi-widget-dialog',
    templateUrl: './widget-new-dialog.component.html'
})
export class WidgetNewDialogComponent implements OnInit {

    widget: Widget;
    isSaving: boolean;

    datasets: DataSet[];

    datasources: DataSource[];

    dashboards: Dashboard[];

    currentDashboardId: number;
    availablePrimaryWidgets: Widget[];
    chosenPrimaryWidget: Widget;

    sourceType: SourceType = SourceType.DATASOURCE;
    widgetTypeUserChoices: string[];
    userChosenWidgetType: string = 'graph';

    constructor(
        private principal: Principal,
        public bsModalRef: BsModalRef,
        private widgetService: WidgetService,
        private notificationService: NotificationService,
        private dataSourceService: DataSourceService,
        private dashboardService: DashboardService,
        private eventManager: JhiEventManager,
        protected widgetEventBusService: WidgetEventBusService
    ) {}

    ngOnInit() {
        this.isSaving = false;
        this.dataSourceService.query({
            page: 0,
            size: 1000
        })
            .subscribe((res: HttpResponse<DataSource[]>) => { this.datasources = res.body; }, (res: HttpErrorResponse) => this.onError(res.error));
        this.dashboardService.query()
            .subscribe((res: HttpResponse<Dashboard[]>) => { this.dashboards = res.body; }, (res: HttpErrorResponse) => this.onError(res.error));

        this.initAvailablePrimaryWidgets();
        this.initChoosableWidgetAccordingToUserIdentities();
    }

    initChoosableWidgetAccordingToUserIdentities() {
        this.widgetTypeUserChoices = [
            'graph',
            'query',
            'text editor',
            'table',
            'pie chart',
            'bar chart'
        ];
    }

    initAvailablePrimaryWidgets() {
        if (this.currentDashboardId) {
            const request = {
                page: 0,
                size: 20,
                query: ''
            };
            this.widgetService.getWidgetsByDashboardId(this.currentDashboardId, request).subscribe((res: HttpResponse<Widget[]>) => {
                this.availablePrimaryWidgets = res.body;
                this.availablePrimaryWidgets = this.availablePrimaryWidgets.filter((widget: Widget) => {
                    if (widget.type === WidgetType.GRAPH || widget.type === WidgetType.TABLE  || widget.type === WidgetType.QUERY) {
                        return true;
                    }
                    return false;
                });
            }, (err: HttpErrorResponse) => {
                const message = 'Error during primary widgets fetching.';
                this.notificationService.push('error', 'Widgets loading', message);
                console.log(err.message);
            });
        } else {
            setTimeout(() => {
                this.initAvailablePrimaryWidgets();
            }, 50);
        }
    }

    clear() {
        this.bsModalRef.hide();
    }

    handleWidgetTypeChange() {
        if (!this.userChosenWidgetType.includes('chart') && this.sourceType === SourceType.WIDGET) {
            // then it's a primary widget for sure
            this.sourceType = SourceType.DATASOURCE;
        } else if (this.userChosenWidgetType === 'text editor') {
            // text widget does not have a datasource
            this.sourceType = undefined;
        } else if (!this.sourceType && this.userChosenWidgetType !== 'text editor') {
            this.sourceType = SourceType.DATASOURCE;
        }
    }

    save() {
        this.isSaving = true;

        // setting the widget type
        this.setWidgetTypeAndDatasource();

        if (this.widget.id !== undefined) {
            this.subscribeToSaveResponse(
                this.widgetService.update(this.widget));
        } else {
            this.subscribeToSaveResponse(
                this.widgetService.create(this.widget));
        }

    }

    setWidgetTypeAndDatasource() {

        switch (this.userChosenWidgetType) {
            case 'graph':
                this.widget.type = WidgetType.GRAPH;
                break;
            case 'query':
                this.widget.type = WidgetType.QUERY;
                break;
            case 'text editor':
                this.widget.type = WidgetType.TEXTEDITOR;
                break;
            case 'table':
                this.widget.type = WidgetType.TABLE;
                break;
            case 'pie chart':
                if (this.sourceType === SourceType.DATASOURCE) {
                    this.widget.type = WidgetType.INDEPENDENT_PIE_CHART;
                } else {
                    if (this.chosenPrimaryWidget.type === WidgetType.QUERY) {
                        this.widget.type = WidgetType.SECONDARY_QUERY_PIE_CHART;
                    } else {
                        this.widget.type = WidgetType.SECONDARY_PIE_CHART;
                    }
                    this.widget.primaryWidgetId = this.chosenPrimaryWidget.id;
                    this.widget.dataSourceId = this.chosenPrimaryWidget.dataSourceId;
                }
                break;
            case 'bar chart':
                if (this.sourceType === SourceType.DATASOURCE) {
                    this.widget.type = WidgetType.INDEPENDENT_BAR_CHART;
                } else {
                    if (this.chosenPrimaryWidget.type === WidgetType.QUERY) {
                        this.widget.type = WidgetType.SECONDARY_QUERY_BAR_CHART;
                    } else {
                        this.widget.type = WidgetType.SECONDARY_BAR_CHART;
                    }
                    this.widget.primaryWidgetId = this.chosenPrimaryWidget.id;
                    this.widget.dataSourceId = this.chosenPrimaryWidget.dataSourceId;
                }
                break;
        }
    }

    private subscribeToSaveResponse(result: Observable<Widget>) {
        result.subscribe((res: Widget) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: Widget) {
        this.eventManager.broadcast({
            name: 'widgetListModification',
            eventOccurred: 'new-widget',
            description: 'Created a Widget',
            content: result
        });
        this.isSaving = false;

        if (result.primaryWidgetId) {
            const content: NewWidgetConnectionMessageContent = {
                primaryWidgetId: result.primaryWidgetId,
                secondaryWidgetId: result.id
            };
            this.widgetEventBusService.publish(MessageType.NEW_WIDGET_CONNECTION, new NewWidgetConnectionMessage(content));
        }

        this.bsModalRef.hide();
    }

    private onSaveError(error: any) {
        this.isSaving = false;
        this.notificationService.push('error', 'Widget creation failed', error.title);
    }

    private onError(error: any) {
        this.notificationService.push('error', 'Widget init error', error.title);
    }

    trackDataSetById(index: number, item: DataSet) {
        return item.id;
    }

    trackDataSourceById(index: number, item: DataSource) {
        return item.id;
    }

    trackDashboardById(index: number, item: Dashboard) {
        return item.id;
    }
}

@Component({
    selector: 'jhi-widget-popup',
    template: ''
})
export class WidgetNewPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private widgetPopupService: WidgetPopupService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.queryParams.subscribe((params) => {
            if (params['id']) {
                this.widgetPopupService
                    .open(WidgetNewDialogComponent as Component, params['id']);
            } else {
                if (params['dashboardId']) {
                    const dashboardId = parseInt(params['dashboardId'], 10);
                    this.widgetPopupService
                        .open(WidgetNewDialogComponent as Component, undefined, dashboardId);
                } else {
                    this.widgetPopupService
                        .open(WidgetNewDialogComponent as Component);
                }
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}

export const enum SourceType {
    DATASOURCE = 'datasource',
    WIDGET = 'widget'
}
