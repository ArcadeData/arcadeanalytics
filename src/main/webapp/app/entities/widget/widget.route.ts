import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Routes } from '@angular/router';

import { UserRouteAccessService, CanDeactivateGuard } from '../../shared';
import { JhiPaginationUtil } from 'ng-jhipster';

import { WidgetComponent } from './widget.component';
import { WidgetDetailComponent } from './widget-detail.component';
import { WidgetNewPopupComponent } from './widget-new-dialog.component';
import { WidgetEditPopupComponent } from './widget-edit-dialog.component';
import { WidgetDeletePopupComponent } from './widget-delete-dialog.component';
import { WidgetEmbedComponent } from './widget-embed.component';

@Injectable({ providedIn: 'root' })
export class WidgetResolvePagingParams implements Resolve<any> {

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

    resolveTypeParam(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const type = route.queryParams['type'] ? route.queryParams['type'] : 'undefined';
        return {
            type: type
        };
    }
}

export const widgetRoute: Routes = [
    {
        path: 'widget',
        component: WidgetComponent,
        resolve: {
            'pagingParams': WidgetResolvePagingParams
        },
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.widget.home.title'
        },
        canActivate: [UserRouteAccessService]
    }, {
        path: 'widget/:id',
        component: WidgetDetailComponent,
        data: {
            authorities: ['ROLE_EDITOR', 'ROLE_READER'],
            pageTitle: 'arcadeanalyticsApp.widget.home.title'
        },
        canActivate: [UserRouteAccessService],
        canDeactivate: [CanDeactivateGuard]
    }, {
        path: 'embed/widget/:id',
        component: WidgetEmbedComponent,
        resolve: {
            'pagingParams': WidgetResolvePagingParams
        },
        data: {
            authorities: ['ROLE_READER'],
            pageTitle: 'arcadeanalyticsApp.widget.home.title'
        },
        // canActivate: [UserRouteAccessService],
        canDeactivate: [CanDeactivateGuard]
    }
];

export const widgetPopupRoute: Routes = [
    {
        path: 'widget-new',
        component: WidgetNewPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.widget.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'widget/:id/edit',
        component: WidgetEditPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.widget.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'widget/:id/delete',
        component: WidgetDeletePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.widget.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    }
];
