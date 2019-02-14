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
