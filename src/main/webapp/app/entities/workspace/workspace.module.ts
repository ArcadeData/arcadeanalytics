import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ArcadeanalyticsSharedModule } from '../../shared';
import { ArcadeanalyticsAdminModule } from '../../admin/admin.module';
import {
    WorkspaceService,
    WorkspacePopupService,
    WorkspaceComponent,
    WorkspaceDetailComponent,
    WorkspaceDialogComponent,
    WorkspacePopupComponent,
    WorkspaceDeletePopupComponent,
    WorkspaceDeleteDialogComponent,
    workspaceRoute,
    workspacePopupRoute,
    WorkspaceResolvePagingParams,
} from './';

const ENTITY_STATES = [
    ...workspaceRoute,
    ...workspacePopupRoute,
];

@NgModule({
    imports: [
        ArcadeanalyticsSharedModule,
        ArcadeanalyticsAdminModule,
        RouterModule.forChild(ENTITY_STATES)
    ],
    declarations: [
        WorkspaceComponent,
        WorkspaceDetailComponent,
        WorkspaceDialogComponent,
        WorkspaceDeleteDialogComponent,
        WorkspacePopupComponent,
        WorkspaceDeletePopupComponent,
    ],
    entryComponents: [
        WorkspaceComponent,
        WorkspaceDialogComponent,
        WorkspacePopupComponent,
        WorkspaceDeleteDialogComponent,
        WorkspaceDeletePopupComponent,
    ],
    providers: [
        WorkspaceService,
        WorkspacePopupService,
        WorkspaceResolvePagingParams,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArcadeanalyticsWorkspaceModule { }
