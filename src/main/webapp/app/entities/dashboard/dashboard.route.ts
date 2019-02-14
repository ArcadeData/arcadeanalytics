import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Routes } from '@angular/router';

import { UserRouteAccessService, CanDeactivateGuard } from '../../shared';
import { JhiPaginationUtil } from 'ng-jhipster';

import { DashboardComponent } from './dashboard.component';
import { DashboardDetailComponent } from './dashboard-detail.component';
import { DashboardPopupComponent } from './dashboard-dialog.component';
import { DashboardDeletePopupComponent } from './dashboard-delete-dialog.component';
import { DashboardEmbedComponent } from './dashboard-embed.component';

@Injectable({ providedIn: 'root' })
export class DashboardResolvePagingParams implements Resolve<any> {

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

export const dashboardRoute: Routes = [
    {
        path: 'dashboard',
        component: DashboardComponent,
        resolve: {
            'pagingParams': DashboardResolvePagingParams
        },
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dashboard.home.title'
        },
        canActivate: [UserRouteAccessService]
    }, {
        path: 'dashboard/:id',
        component: DashboardDetailComponent,
        data: {
            authorities: ['ROLE_EDITOR', 'ROLE_READER'],
            pageTitle: 'arcadeanalyticsApp.dashboard.home.title'
        },
        canActivate: [UserRouteAccessService],
        // canDeactivate: [CanDeactivateGuard]
    }, {
        path: 'embed/dashboard/:id',
        component: DashboardEmbedComponent,
        data: {
            authorities: ['ROLE_READER'],
            pageTitle: 'arcadeanalyticsApp.dashboard.home.title'
        },
        // canActivate: [UserRouteAccessService],
        // canDeactivate: [CanDeactivateGuard]
    }
];

export const dashboardPopupRoute: Routes = [
    {
        path: 'dashboard-new',
        component: DashboardPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dashboard.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'dashboard/:id/edit',
        component: DashboardPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dashboard.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'dashboard/:id/delete',
        component: DashboardDeletePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.dashboard.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    }
];
