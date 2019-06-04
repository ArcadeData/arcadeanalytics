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
import {NotificationService} from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

/**
 * Used for 'edit-widget' and 'create-widget' workflows.
 */
@Component({
    selector: 'jhi-widget-edit-dialog',
    templateUrl: './widget-edit-dialog.component.html'
})
export class WidgetEditDialogComponent implements OnInit {

    widget: Widget;
    isSaving: boolean;

    availablePrimaryWidgets: Widget[];
    chosenPrimaryWidget: Widget;

    datasets: DataSet[];

    datasources: DataSource[];

    dashboards: Dashboard[];

    widgetTypes2abstractTypes: Object;

    constructor(
        public bsModalRef: BsModalRef,
        private widgetService: WidgetService,
        private notificationService: NotificationService,
        private dataSourceService: DataSourceService,
        private dashboardService: DashboardService,
        private eventManager: JhiEventManager
    ) {
        this.widgetTypes2abstractTypes = {
            'graph': 'graph',
            'query': 'query',
            'text-editor': 'text editor',
            'table': 'table',
            'independent-pie-chart': 'pie-chart',
            'secondary-pie-chart': 'pie-chart',
            'independent-bar-chart': 'bar chart',
            'secondary-bar-chart': 'bar chart'
        };
    }

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
    }

    initAvailablePrimaryWidgets() {
        if (this.widget && this.widget.dashboardId) {
            const request = {
                page: 0,
                size: 20,
                query: ''
            };
            this.widgetService.getWidgetsByDashboardId(this.widget.dashboardId, request).subscribe((res: HttpResponse<Widget[]>) => {
                this.availablePrimaryWidgets = res.body;
                this.availablePrimaryWidgets = this.availablePrimaryWidgets.filter((widget: Widget) => {
                    if (widget.type === WidgetType.GRAPH || widget.type === WidgetType.TABLE  || widget.type === WidgetType.QUERY) {
                        return true;
                    }
                    return false;
                });
                for (const currWidget of this.availablePrimaryWidgets) {
                    if (currWidget.id === this.widget.primaryWidgetId) {
                        this.chosenPrimaryWidget = currWidget;
                    }
                }
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

    save() {
        this.isSaving = true;
        if (this.widget.id !== undefined) {
            this.subscribeToSaveResponse(
                this.widgetService.update(this.widget));
        } else {
            this.subscribeToSaveResponse(
                this.widgetService.create(this.widget));
        }

    }
    private subscribeToSaveResponse(result: Observable<Widget>) {
        result.subscribe((res: Widget) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: Widget) {
        this.eventManager.broadcast({
            name: 'widgetListModification',
            eventOccurred: 'widget-edited',
            description: 'Edited a Widget',
            content: result
        });
        this.isSaving = false;
        this.bsModalRef.hide();
    }

    private onSaveError(error: any) {
        this.isSaving = false;
        this.notificationService.push('error', 'Widget editing failed', error.title);
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
    selector: 'jhi-widget-edit-popup',
    template: ''
})
export class WidgetEditPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private widgetPopupService: WidgetPopupService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.queryParams.subscribe((params) => {
            if (params['id']) {
                this.widgetPopupService
                    .open(WidgetEditDialogComponent as Component, params['id']);
            } else {
                if (params['dashboardId']) {
                    const dashboardId = parseInt(params['dashboardId'], 10);
                    this.widgetPopupService
                        .open(WidgetEditDialogComponent as Component, undefined, dashboardId);
                } else {
                    this.widgetPopupService
                        .open(WidgetEditDialogComponent as Component);
                }
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
