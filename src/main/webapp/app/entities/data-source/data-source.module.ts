import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ArcadeanalyticsSharedModule } from '../../shared';
import {
    DataSourceService,
    DataSourcePopupService,
    DataSourceComponent,
    DataSourceDetailComponent,
    DataSourceDialogComponent,
    DataSourcePopupComponent,
    DataSourceDeletePopupComponent,
    DataSourceDeleteDialogComponent,
    dataSourceRoute,
    dataSourcePopupRoute,
    DataSourceResolvePagingParams,
} from './';

const ENTITY_STATES = [
    ...dataSourceRoute,
    ...dataSourcePopupRoute,
];

@NgModule({
    imports: [
        ArcadeanalyticsSharedModule,
        RouterModule.forChild(ENTITY_STATES)
    ],
    declarations: [
        DataSourceComponent,
        DataSourceDetailComponent,
        DataSourceDialogComponent,
        DataSourceDeleteDialogComponent,
        DataSourcePopupComponent,
        DataSourceDeletePopupComponent,
    ],
    entryComponents: [
        DataSourceComponent,
        DataSourceDialogComponent,
        DataSourcePopupComponent,
        DataSourceDeleteDialogComponent,
        DataSourceDeletePopupComponent,
    ],
    providers: [
        DataSourceService,
        DataSourcePopupService,
        DataSourceResolvePagingParams,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArcadeanalyticsDataSourceModule {}
