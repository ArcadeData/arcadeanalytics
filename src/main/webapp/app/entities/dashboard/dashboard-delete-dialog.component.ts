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

import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { Dashboard } from './dashboard.model';
import { DashboardPopupService } from './dashboard-popup.service';
import { DashboardService } from './dashboard.service';
import { NotificationService } from '../../shared/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Used for 'delete-dashboard' workflow.
 */
@Component({
    selector: 'jhi-dashboard-delete-dialog',
    templateUrl: './dashboard-delete-dialog.component.html'
})
export class DashboardDeleteDialogComponent {

    dashboard: Dashboard;
    dashboardSharedAlert: string = `the current dashboard is shared, if you remove this dashboard
    it won't be available anymore in all the pages where is now embedded.`;

    constructor(
        private dashboardService: DashboardService,
        public bsModalRef: BsModalRef,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    clear() {
        this.bsModalRef.hide();
    }

    confirmDelete(id: number) {
        this.dashboardService.delete(id).subscribe((response) => {
                this.eventManager.broadcast({
                    name: 'dashboardListModification',
                    content: 'dashboard-delete',
                    dashboardId: id
                });
                this.bsModalRef.hide();
            },
            (error: HttpErrorResponse) => {
                const err = error.error;
                this.notificationService.push('error', 'Dashboard deletion failed', err['title']);
                this.bsModalRef.hide();
            });
    }
}

@Component({
    selector: 'jhi-dashboard-delete-popup',
    template: ''
})
export class DashboardDeletePopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private dashboardPopupService: DashboardPopupService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            this.dashboardPopupService
                .open(DashboardDeleteDialogComponent as Component, params['id']);
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
