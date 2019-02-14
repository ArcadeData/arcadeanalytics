import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { Dashboard } from './dashboard.model';
import { DashboardPopupService } from './dashboard-popup.service';
import { DashboardService } from './dashboard.service';
import { Workspace, WorkspaceService } from '../workspace';
import { ResponseWrapper } from '../../shared';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

/**
 * Used for 'edit-dashboard' and 'new-dashboard' workflows.
 */
@Component({
    selector: 'jhi-dashboard-dialog',
    templateUrl: './dashboard-dialog.component.html'
})
export class DashboardDialogComponent implements OnInit {

    dashboard: Dashboard;
    isSaving: boolean;

    workspaces: Workspace[];

    constructor(
        public bsModalRef: BsModalRef,
        private dashboardService: DashboardService,
        private workspaceService: WorkspaceService,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    ngOnInit() {
        this.isSaving = false;
        this.workspaceService.query()
            .subscribe((res: HttpResponse<Workspace[]>) => { this.workspaces = res.body; }, (res: HttpErrorResponse) => this.onError(res.error));
    }

    clear() {
        this.bsModalRef.hide();
    }

    save() {
        this.isSaving = true;
        if (this.dashboard.id !== undefined) {
            this.subscribeToSaveResponse(
                this.dashboardService.update(this.dashboard));
        } else {
            this.subscribeToSaveResponse(
                this.dashboardService.create(this.dashboard));
        }
    }

    private subscribeToSaveResponse(result: Observable<Dashboard>) {
        result.subscribe((res: Dashboard) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: Dashboard) {
        this.eventManager.broadcast({ name: 'dashboardListModification', content: 'dashboard-upsert', dashboardId: result['id'] });
        this.isSaving = false;
        this.bsModalRef.hide();
    }

    private onSaveError(error: any) {
        this.isSaving = false;
        this.notificationService.push('error', 'Dashboard creation failed', error.title);
    }

    private onError(error: any) {
        this.notificationService.push('error', 'Dashboard init error', error.title);
    }

    trackWorkspaceById(index: number, item: Workspace) {
        return item.id;
    }
}

@Component({
    selector: 'jhi-dashboard-popup',
    template: ''
})
export class DashboardPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private dashboardPopupService: DashboardPopupService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if (params['id']) {
                this.dashboardPopupService
                    .open(DashboardDialogComponent as Component, params['id']);
            } else {
                this.dashboardPopupService
                    .open(DashboardDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
