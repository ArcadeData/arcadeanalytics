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

import { ContractComponent } from './contract.component';
import { ContractDetailComponent } from './contract-detail.component';
import { ContractPopupComponent } from './contract-dialog.component';
import { ContractDeletePopupComponent } from './contract-delete-dialog.component';

@Injectable({ providedIn: 'root' })
export class ContractResolvePagingParams implements Resolve<any> {

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

export const contractRoute: Routes = [
    {
        path: 'contract',
        component: ContractComponent,
        resolve: {
            'pagingParams': ContractResolvePagingParams
        },
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.contract.home.title'
        },
        canActivate: [UserRouteAccessService]
    }, {
        path: 'contract/:id',
        component: ContractDetailComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.contract.home.title'
        },
        canActivate: [UserRouteAccessService]
    }
];

export const contractPopupRoute: Routes = [
    {
        path: 'contract-new',
        component: ContractPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.contract.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'contract/:id/edit',
        component: ContractPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.contract.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'contract/:id/delete',
        component: ContractDeletePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.contract.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    }
];
