import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ArcadeanalyticsSharedModule } from '../../shared';
import {
    MediaService,
    MediaPopupService,
    MediaComponent,
    MediaDetailComponent,
    MediaEditDialogComponent,
    MediaEditPopupComponent,
    MediaUploadDialogComponent,
    MediaUploadPopupComponent,
    MediaDeletePopupComponent,
    MediaDeleteDialogComponent,
    mediaRoute,
    mediaPopupRoute,
    MediaResolvePagingParams,
} from './';

const ENTITY_STATES = [
    ...mediaRoute,
    ...mediaPopupRoute,
];

@NgModule({
    imports: [
        ArcadeanalyticsSharedModule,
        RouterModule.forChild(ENTITY_STATES)
    ],
    declarations: [
        MediaComponent,
        MediaDetailComponent,
        MediaEditDialogComponent,
        MediaUploadDialogComponent,
        MediaDeleteDialogComponent,
        MediaEditPopupComponent,
        MediaUploadPopupComponent,
        MediaDeletePopupComponent,
    ],
    entryComponents: [
        MediaComponent,
        MediaEditDialogComponent,
        MediaEditPopupComponent,
        MediaUploadDialogComponent,
        MediaUploadPopupComponent,
        MediaDeleteDialogComponent,
        MediaDeletePopupComponent,
    ],
    providers: [
        MediaService,
        MediaPopupService,
        MediaResolvePagingParams,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArcadeanalyticsMediaModule { }
