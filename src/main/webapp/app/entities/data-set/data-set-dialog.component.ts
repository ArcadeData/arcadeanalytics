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

import { DataSet } from './data-set.model';
import { DataSetPopupService } from './data-set-popup.service';
import { DataSetService } from './data-set.service';
import { Dashboard, DashboardService } from '../dashboard';
import { DataSource, DataSourceService } from '../data-source';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

/**
 * Used for 'edit-data-set' and 'new-data-set' workflows.
 */
@Component({
    selector: 'jhi-data-set-dialog',
    templateUrl: './data-set-dialog.component.html'
})
export class DataSetDialogComponent implements OnInit {

    dataSet: DataSet;
    isSaving: boolean;

    dashboards: Dashboard[];

    datasources: DataSource[];

    constructor(
        public bsModalRef: BsModalRef,
        private dataSetService: DataSetService,
        private dashboardService: DashboardService,
        private dataSourceService: DataSourceService,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    ngOnInit() {
        this.isSaving = false;
        this.dashboardService.query()
            .subscribe((res: HttpResponse<Dashboard[]>) => { this.dashboards = res.body; }, (res: HttpErrorResponse) => this.onError(res.error));
        this.dataSourceService.query({
            page: 0,
            size: 1000
        }).subscribe((res: HttpResponse<DataSource[]>) => { this.datasources = res.body; }, (res: HttpErrorResponse) => this.onError(res.error));
    }

    clear() {
        this.bsModalRef.hide();
    }

    save() {
        this.isSaving = true;
        if (this.dataSet.id !== undefined) {
            this.subscribeToSaveResponse(
                this.dataSetService.update(this.dataSet));
        } else {
            this.subscribeToSaveResponse(
                this.dataSetService.create(this.dataSet));
        }
    }

    private subscribeToSaveResponse(result: Observable<DataSet>) {
        result.subscribe((res: DataSet) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: DataSet) {
        this.eventManager.broadcast({ name: 'dataSetListModification', content: 'OK'});
        this.isSaving = false;
        this.bsModalRef.hide();
    }

    private onSaveError(error: any) {
        this.isSaving = false;
        this.notificationService.push('error', 'Data Set creation failed', error.title);
    }

    private onError(error: any) {
        this.notificationService.push('error', 'Data Set init error', error.title);
    }

    trackDashboardById(index: number, item: Dashboard) {
        return item.id;
    }

    trackDataSourceById(index: number, item: DataSource) {
        return item.id;
    }
}

@Component({
    selector: 'jhi-data-set-popup',
    template: ''
})
export class DataSetPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private dataSetPopupService: DataSetPopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if ( params['id'] ) {
                this.dataSetPopupService
                    .open(DataSetDialogComponent as Component, params['id']);
            } else {
                this.dataSetPopupService
                    .open(DataSetDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
