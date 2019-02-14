import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Routes } from '@angular/router';

import { UserRouteAccessService } from '../../shared';
import { JhiPaginationUtil } from 'ng-jhipster';

import { MediaComponent } from './media.component';
import { MediaDetailComponent } from './media-detail.component';
import { MediaEditPopupComponent } from './media-edit-dialog.component';
import { MediaDeletePopupComponent } from './media-delete-dialog.component';
import { MediaUploadPopupComponent } from './media-upload-dialog.component';

@Injectable({ providedIn: 'root' })
export class MediaResolvePagingParams implements Resolve<any> {

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

export const mediaRoute: Routes = [
    {
        path: 'media',
        component: MediaComponent,
        resolve: {
            'pagingParams': MediaResolvePagingParams
        },
        data: {
            authorities: ['ROLE_EDITOR', 'ROLE_READER'],
            pageTitle: 'arcadeanalyticsApp.media.home.title'
        },
        canActivate: [UserRouteAccessService]
    }, {
        path: 'media/:id',
        component: MediaDetailComponent,
        data: {
            authorities: ['ROLE_EDITOR', 'ROLE_READER'],
            pageTitle: 'arcadeanalyticsApp.media.home.title'
        },
        canActivate: [UserRouteAccessService]
    }
];

export const mediaPopupRoute: Routes = [
    {
        path: 'media-new',
        component: MediaUploadPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.media.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'media/:id/edit',
        component: MediaEditPopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.media.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    },
    {
        path: 'media/:id/delete',
        component: MediaDeletePopupComponent,
        data: {
            authorities: ['ROLE_EDITOR'],
            pageTitle: 'arcadeanalyticsApp.media.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    }
];
