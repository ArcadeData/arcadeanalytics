import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ArcadeanalyticsSharedModule } from '../../shared';
import { ArcadeanalyticsAdminModule } from '../../admin/admin.module';
import {
    ArcadeUserService,
    ArcadeUserPopupService,
    ArcadeUserComponent,
    ArcadeUserDetailComponent,
    ArcadeUserDialogComponent,
    ArcadeUserPopupComponent,
    ArcadeUserDeletePopupComponent,
    ArcadeUserDeleteDialogComponent,
    arcadeUserRoute,
    arcadeUserPopupRoute,
    ArcadeUserResolvePagingParams,
} from './';

const ENTITY_STATES = [
    ...arcadeUserRoute,
    ...arcadeUserPopupRoute,
];

@NgModule({
    imports: [
        ArcadeanalyticsSharedModule,
        ArcadeanalyticsAdminModule,
        RouterModule.forChild(ENTITY_STATES)
    ],
    declarations: [
        ArcadeUserComponent,
        ArcadeUserDetailComponent,
        ArcadeUserDialogComponent,
        ArcadeUserDeleteDialogComponent,
        ArcadeUserPopupComponent,
        ArcadeUserDeletePopupComponent,
    ],
    entryComponents: [
        ArcadeUserComponent,
        ArcadeUserDialogComponent,
        ArcadeUserPopupComponent,
        ArcadeUserDeleteDialogComponent,
        ArcadeUserDeletePopupComponent,
    ],
    providers: [
        ArcadeUserService,
        ArcadeUserPopupService,
        ArcadeUserResolvePagingParams,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArcadeanalyticsArcadeUserModule {}
