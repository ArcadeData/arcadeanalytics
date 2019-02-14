import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ArcadeanalyticsSharedModule } from '../../shared';
import { ArcadeanalyticsWidgetModule } from '../widget';
import {
    DashboardService,
    DashboardPopupService,
    DashboardComponent,
    DashboardDetailComponent,
    DashboardEmbedComponent,
    DashboardDialogComponent,
    DashboardPopupComponent,
    DashboardDeletePopupComponent,
    DashboardDeleteDialogComponent,
    dashboardRoute,
    dashboardPopupRoute,
    DashboardResolvePagingParams,
} from './';

const ENTITY_STATES = [
    ...dashboardRoute,
    ...dashboardPopupRoute,
];

@NgModule({
    imports: [
        ArcadeanalyticsSharedModule,
        RouterModule.forChild(ENTITY_STATES),
        ArcadeanalyticsWidgetModule
    ],
    declarations: [
        DashboardComponent,
        DashboardDetailComponent,
        DashboardEmbedComponent,
        DashboardDialogComponent,
        DashboardDeleteDialogComponent,
        DashboardPopupComponent,
        DashboardDeletePopupComponent,
    ],
    entryComponents: [
        DashboardComponent,
        DashboardDialogComponent,
        DashboardPopupComponent,
        DashboardDeleteDialogComponent,
        DashboardDeletePopupComponent,
    ],
    providers: [
        DashboardService,
        DashboardPopupService,
        DashboardResolvePagingParams,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArcadeanalyticsDashboardModule {}
