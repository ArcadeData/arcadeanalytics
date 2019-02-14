import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { Workspace } from './workspace.model';
import { WorkspacePopupService } from './workspace-popup.service';
import { WorkspaceService } from './workspace.service';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Used for 'delete-workspace' workflow.
 */
@Component({
    selector: 'jhi-workspace-delete-dialog',
    templateUrl: './workspace-delete-dialog.component.html'
})
export class WorkspaceDeleteDialogComponent {

    workspace: Workspace;

    constructor(
        private workspaceService: WorkspaceService,
        public bsModalRef: BsModalRef,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    clear() {
        this.bsModalRef.hide();
    }

    confirmDelete(id: number) {
        this.workspaceService.delete(id).subscribe((response) => {
                this.eventManager.broadcast({
                    name: 'workspaceListModification',
                    content: 'Deleted a workspace'
                });
                this.bsModalRef.hide();
            },
            (error: HttpErrorResponse) => {
                const err = error.error;
                this.notificationService.push('error', 'Workspace deletion failed', err.title);
                this.bsModalRef.hide();
            });
    }
}

@Component({
    selector: 'jhi-workspace-delete-popup',
    template: ''
})
export class WorkspaceDeletePopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private workspacePopupService: WorkspacePopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            this.workspacePopupService
                .open(WorkspaceDeleteDialogComponent as Component, params['id']);
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
