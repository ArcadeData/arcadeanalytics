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
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Routes } from '@angular/router';

import { UserRouteAccessService } from '../../shared';
import { JhiPaginationUtil } from 'ng-jhipster';

import { WorkspaceComponent } from './workspace.component';
import { WorkspaceDetailComponent } from './workspace-detail.component';
import { WorkspacePopupComponent } from './workspace-dialog.component';
import { WorkspaceDeletePopupComponent } from './workspace-delete-dialog.component';

@Injectable({ providedIn: 'root' })
export class WorkspaceResolvePagingParams implements Resolve<any> {

    constructor(private paginationUtil: JhiPaginationUtil) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const page = route.queryParams['page'] ? route.queryParams['page'] : '1';
        const sort = route.queryParams['sort'] ? route.queryParams['sort'] : 'id,asc';
        return {
            page: this.paginationUtil.parsePage(page),
            predicate: this.paginationUtil.parsePredicate(sort),
            ascending: this.paginationUtil.parseAscending(sort)
        };
    }
}

export const workspaceRoute: Routes = [
    {
        path: 'workspace',
        component: WorkspaceComponent,
        resolve: {
            'pagingParams': WorkspaceResolvePagingParams
        },
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.workspace.home.title'
        },
        canActivate: [UserRouteAccessService]
    }, {
        path: 'workspace/:id',
        component: WorkspaceDetailComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.workspace.home.title'
        },
        canActivate: [UserRouteAccessService]
    }
];

export const workspacePopupRoute: Routes = [
    {
        path: 'workspace-new',
        component: WorkspacePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.workspace.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'workspace/:id/edit',
        component: WorkspacePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.workspace.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'workspace/:id/delete',
        component: WorkspaceDeletePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.workspace.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    }
];
