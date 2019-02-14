import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';

import { Workspace } from './workspace.model';
import { WorkspaceService } from './workspace.service';
import { HttpResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-workspace-detail',
    templateUrl: './workspace-detail.component.html'
})
export class WorkspaceDetailComponent implements OnInit, OnDestroy {

    workspace: Workspace;
    private subscription: Subscription;
    private eventSubscriber: Subscription;

    constructor(
        private eventManager: JhiEventManager,
        private workspaceService: WorkspaceService,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        this.subscription = this.route.params.subscribe((params) => {
            this.load(params['id']);
        });
        this.registerChangeInWorkspaces();
    }

    load(id) {
        this.workspaceService.find(id).subscribe((workspace: Workspace) => {
            this.workspace = workspace;
        });
    }
    previousState() {
        window.history.back();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.eventManager.destroy(this.eventSubscriber);
    }

    registerChangeInWorkspaces() {
        this.eventSubscriber = this.eventManager.subscribe(
            'workspaceListModification',
            (response) => this.load(this.workspace.id)
        );
    }
}
