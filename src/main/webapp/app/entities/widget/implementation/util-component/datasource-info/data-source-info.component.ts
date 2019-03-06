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
import { Component, OnInit, OnDestroy, OnChanges, Input, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';

import { NotificationService, Principal } from '../../../../../shared';
import { DataSource } from '../../../../data-source/data-source.model';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { Workspace } from '../../../../workspace/workspace.model';
import { WorkspaceService } from '../../../../workspace/workspace.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'data-source-info',
    templateUrl: './data-source-info.component.html',
    styleUrls: ['./data-source-info.component.scss']
})
export class DataSourceInfoComponent implements OnInit, OnDestroy, OnChanges {

    @Input() dataSource: DataSource;
    @Input() height: string;
    workspace: Workspace;
    canTestConnection: boolean = false;
    datasourceModificationSubscriber: Subscription;

    @Output() datasourceIndexingCall: EventEmitter<Object> = new EventEmitter();

    constructor(
        private eventManager: JhiEventManager,
        private dataSourceService: DataSourceService,
        private workspaceService: WorkspaceService,
        private notificationService: NotificationService,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        this.registerChangeInDataSource();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.updateTestConnectionFlag();
        this.loadWorkspace();
    }

    loadWorkspace(workspaceId?: number) {
        let id: number = workspaceId;
        if (!id) {
            id = this.dataSource['workspaceId'];
        }
        this.workspaceService.find(id).subscribe((res: Workspace) => {
            this.workspace = res;
        });
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.datasourceModificationSubscriber);
    }

    registerChangeInDataSource() {
        this.datasourceModificationSubscriber = this.eventManager.subscribe('dataSourceModification', (response) => {
            this.dataSourceService.find(this.dataSource['id']).subscribe((res: DataSource) => {
                const dataSource = res;
                if (this.dataSource['workspaceId'] !== dataSource['workspaceId']) {
                    // workspace reference was updated, then we need to reload the workspace
                    this.loadWorkspace(dataSource['workspaceId']);
                }
                this.dataSource = dataSource;
                this.updateTestConnectionFlag();
            });
        });
    }

    testConnection() {

        const infoNotification = this.notificationService.push('info', 'Data Source Connection', 'Testing connection...', 20000, 'fa fa-spinner fa-spin');
        this.dataSourceService.testConnection(this.dataSource).subscribe((res: Object) => {
            const message = 'Connection alive';
            this.notificationService.updateNotification(infoNotification, 'success', 'Data Source Connection', message, undefined, true);
        }, (error: HttpErrorResponse) => {
            const message = 'Connection NOT alive';
            this.notificationService.updateNotification(infoNotification, 'error', 'Data Source Connection', message, undefined, true);
            console.log(error.error);
        });
    }

    updateTestConnectionFlag() {

        if (this.dataSource['type'] !== undefined && this.dataSource['server'] && this.dataSource['port'] && this.dataSource['database']) {
            if (!this.dataSource.remote) {
                this.canTestConnection = true;
            } else {
                // we check also other fields bound to the remote connection
                if (this.dataSource['gateway'] && this.dataSource['sshUser'] && this.dataSource['sshPort']) {
                    this.canTestConnection = true;
                } else {
                    this.canTestConnection = false;
                }
            }
        } else {
            this.canTestConnection = false;
        }
    }

    callDatasourceIndexing() {
        this.datasourceIndexingCall.emit();
    }
}
