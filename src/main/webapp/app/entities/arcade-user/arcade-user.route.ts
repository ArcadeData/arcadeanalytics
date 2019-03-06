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

import { ArcadeUserComponent } from './arcade-user.component';
import { ArcadeUserDetailComponent } from './arcade-user-detail.component';
import { ArcadeUserPopupComponent } from './arcade-user-dialog.component';
import { ArcadeUserDeletePopupComponent } from './arcade-user-delete-dialog.component';

@Injectable({ providedIn: 'root' })
export class ArcadeUserResolvePagingParams implements Resolve<any> {

    constructor(private paginationUtil: JhiPaginationUtil) {}

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

export const arcadeUserRoute: Routes = [
    {
        path: 'arcade-user',
        component: ArcadeUserComponent,
        resolve: {
            'pagingParams': ArcadeUserResolvePagingParams
        },
        data: {
            authorities: ['ROLE_ADMIN'],
            pageTitle: 'arcadeanalyticsApp.arcadeUser.home.title'
        },
        canActivate: [UserRouteAccessService]
    }, {
        path: 'arcade-user/:id',
        component: ArcadeUserDetailComponent,
        data: {
            authorities: ['ROLE_ADMIN'],
            pageTitle: 'arcadeanalyticsApp.arcadeUser.home.title'
        },
        canActivate: [UserRouteAccessService]
    }
];

export const arcadeUserPopupRoute: Routes = [
    {
        path: 'arcade-user-new',
        component: ArcadeUserPopupComponent,
        data: {
            authorities: ['ROLE_ADMIN'],
            pageTitle: 'arcadeanalyticsApp.arcadeUser.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'arcade-user/:id/edit',
        component: ArcadeUserPopupComponent,
        data: {
            authorities: ['ROLE_ADMIN'],
            pageTitle: 'arcadeanalyticsApp.arcadeUser.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'arcade-user/:id/delete',
        component: ArcadeUserDeletePopupComponent,
        data: {
            authorities: ['ROLE_ADMIN'],
            pageTitle: 'arcadeanalyticsApp.arcadeUser.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    }
];
