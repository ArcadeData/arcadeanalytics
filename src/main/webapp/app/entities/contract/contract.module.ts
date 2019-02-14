import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ArcadeanalyticsSharedModule } from '../../shared';
import {
    ContractService,
    ContractPopupService,
    ContractComponent,
    ContractDetailComponent,
    ContractDialogComponent,
    ContractPopupComponent,
    ContractDeletePopupComponent,
    ContractDeleteDialogComponent,
    contractRoute,
    contractPopupRoute,
    ContractResolvePagingParams,
} from './';

const ENTITY_STATES = [
    ...contractRoute,
    ...contractPopupRoute,
];

@NgModule({
    imports: [
        ArcadeanalyticsSharedModule,
        RouterModule.forChild(ENTITY_STATES)
    ],
    declarations: [
        ContractComponent,
        ContractDetailComponent,
        ContractDialogComponent,
        ContractDeleteDialogComponent,
        ContractPopupComponent,
        ContractDeletePopupComponent,
    ],
    entryComponents: [
        ContractComponent,
        ContractDialogComponent,
        ContractPopupComponent,
        ContractDeleteDialogComponent,
        ContractDeletePopupComponent,
    ],
    providers: [
        ContractService,
        ContractPopupService,
        ContractResolvePagingParams,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArcadeanalyticsContractModule {}
