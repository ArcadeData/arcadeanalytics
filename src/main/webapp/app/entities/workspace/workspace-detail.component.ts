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
