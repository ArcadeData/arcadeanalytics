import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ArcadeanalyticsSharedModule } from '../../shared';
import {
    DataSetService,
    DataSetPopupService,
    DataSetComponent,
    DataSetDetailComponent,
    DataSetDialogComponent,
    DataSetPopupComponent,
    DataSetDeletePopupComponent,
    DataSetDeleteDialogComponent,
    dataSetRoute,
    dataSetPopupRoute,
    DataSetResolvePagingParams,
} from './';

const ENTITY_STATES = [
    ...dataSetRoute,
    ...dataSetPopupRoute,
];

@NgModule({
    imports: [
        ArcadeanalyticsSharedModule,
        RouterModule.forChild(ENTITY_STATES)
    ],
    declarations: [
        DataSetComponent,
        DataSetDetailComponent,
        DataSetDialogComponent,
        DataSetDeleteDialogComponent,
        DataSetPopupComponent,
        DataSetDeletePopupComponent,
    ],
    entryComponents: [
        DataSetComponent,
        DataSetDialogComponent,
        DataSetPopupComponent,
        DataSetDeleteDialogComponent,
        DataSetDeletePopupComponent,
    ],
    providers: [
        DataSetService,
        DataSetPopupService,
        DataSetResolvePagingParams,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArcadeanalyticsDataSetModule {}
