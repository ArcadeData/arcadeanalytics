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

import { DataSetComponent } from './data-set.component';
import { DataSetDetailComponent } from './data-set-detail.component';
import { DataSetPopupComponent } from './data-set-dialog.component';
import { DataSetDeletePopupComponent } from './data-set-delete-dialog.component';

@Injectable({ providedIn: 'root' })
export class DataSetResolvePagingParams implements Resolve<any> {

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

export const dataSetRoute: Routes = [
    {
        path: 'data-set',
        component: DataSetComponent,
        resolve: {
            'pagingParams': DataSetResolvePagingParams
        },
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSet.home.title'
        },
        canActivate: [UserRouteAccessService]
    }, {
        path: 'data-set/:id',
        component: DataSetDetailComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSet.home.title'
        },
        canActivate: [UserRouteAccessService]
    }
];

export const dataSetPopupRoute: Routes = [
    {
        path: 'data-set-new',
        component: DataSetPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSet.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'data-set/:id/edit',
        component: DataSetPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSet.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'data-set/:id/delete',
        component: DataSetDeletePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSet.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    }
];
