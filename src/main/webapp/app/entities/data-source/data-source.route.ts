import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Routes, CanActivate } from '@angular/router';

import { UserRouteAccessService } from '../../shared';
import { JhiPaginationUtil } from 'ng-jhipster';

import { DataSourceComponent } from './data-source.component';
import { DataSourceDetailComponent } from './data-source-detail.component';
import { DataSourcePopupComponent } from './data-source-dialog.component';
import { DataSourceDeletePopupComponent } from './data-source-delete-dialog.component';

@Injectable({ providedIn: 'root' })
export class DataSourceResolvePagingParams implements Resolve<any> {

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

export const dataSourceRoute: Routes = [
    {
        path: 'data-source',
        component: DataSourceComponent,
        resolve: {
            'pagingParams': DataSourceResolvePagingParams
        },
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSource.home.title'
        },
        canActivate: [UserRouteAccessService]
    }, {
        path: 'data-source/:id',
        component: DataSourceDetailComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSource.home.title'
        },
        canActivate: [UserRouteAccessService]
    }
];

export const dataSourcePopupRoute: Routes = [
    {
        path: 'data-source-new',
        component: DataSourcePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSource.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'data-source/:id/edit',
        component: DataSourcePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSource.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'data-source/:id/delete',
        component: DataSourceDeletePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dataSource.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    }
];
