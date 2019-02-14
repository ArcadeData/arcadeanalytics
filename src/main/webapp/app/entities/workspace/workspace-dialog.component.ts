import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { Workspace } from './workspace.model';
import { WorkspacePopupService } from './workspace-popup.service';
import { WorkspaceService } from './workspace.service';
import { User, UserService } from '../../shared';
import { ResponseWrapper } from '../../shared';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

/**
 * Used for 'edit-workspace' and 'create-workspace' workflows.
 */
@Component({
    selector: 'jhi-workspace-dialog',
    templateUrl: './workspace-dialog.component.html'
})
export class WorkspaceDialogComponent implements OnInit {

    workspace: Workspace;
    isSaving: boolean;

    users: User[];

    constructor(
        public bsModalRef: BsModalRef,
        private workspaceService: WorkspaceService,
        private userService: UserService,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    ngOnInit() {
        this.isSaving = false;
        this.userService.query()
            .subscribe((res: HttpResponse<User[]>) => { this.users = res.body; }, (res: HttpErrorResponse) => this.onError(res.error));
    }

    clear() {
        this.bsModalRef.hide();
    }

    save() {
        this.isSaving = true;
        if (this.workspace.id !== undefined) {
            this.subscribeToSaveResponse(
                this.workspaceService.update(this.workspace));
        } else {
            this.subscribeToSaveResponse(
                this.workspaceService.create(this.workspace));
        }
    }

    private subscribeToSaveResponse(result: Observable<Workspace>) {
        result.subscribe((res: Workspace) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: Workspace) {
        this.eventManager.broadcast({ name: 'workspaceListModification', content: 'OK'});
        this.isSaving = false;
        this.bsModalRef.hide();
    }

    private onSaveError(error: any) {
        this.isSaving = false;
        this.notificationService.push('error', 'Workspace creation failed', error.title);
    }

    private onError(error: any) {
        this.notificationService.push('error', 'Workspace init error', error.title);
    }

    trackUserById(index: number, item: User) {
        return item.id;
    }
}

@Component({
    selector: 'jhi-workspace-popup',
    template: ''
})
export class WorkspacePopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private workspacePopupService: WorkspacePopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if ( params['id'] ) {
                this.workspacePopupService
                    .open(WorkspaceDialogComponent as Component, params['id']);
            } else {
                this.workspacePopupService
                    .open(WorkspaceDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
