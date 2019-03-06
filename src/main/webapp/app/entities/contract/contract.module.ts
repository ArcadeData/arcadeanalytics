/*-
 * #%L
 * Arcade Analytics
 * %%
 * Copyright (C) 2018 - 2019 ArcadeAnalytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
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
