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
import { DatePipe } from '@angular/common';
import { KeysPipe, KeysByNamePipe, KeysByCountPipe } from './pipes';
import { NotificationService, Base64Service, WidgetEventBusService } from './';

import {
    ArcadeanalyticsSharedLibsModule,
    ArcadeanalyticsSharedCommonModule,
    JhiLoginModalComponent,
    HasAnyAuthorityDirective,
    JhiSocialComponent
} from './';

@NgModule({
    imports: [
        ArcadeanalyticsSharedLibsModule,
        ArcadeanalyticsSharedCommonModule,
    ],
    declarations: [
        JhiSocialComponent,
        JhiLoginModalComponent,
        HasAnyAuthorityDirective,
        KeysPipe,
        KeysByNamePipe,
        KeysByCountPipe
    ],
    providers: [
        DatePipe,
        KeysPipe,
        KeysByNamePipe,
        KeysByCountPipe
    ],
    entryComponents: [
        JhiLoginModalComponent,
    ],
    exports: [
        ArcadeanalyticsSharedCommonModule,
        JhiSocialComponent,
        JhiLoginModalComponent,
        HasAnyAuthorityDirective,
        DatePipe,
        KeysPipe,
        KeysByNamePipe,
        KeysByCountPipe
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class ArcadeanalyticsSharedModule {
    static forRoot() {
        return {
            ngModule: ArcadeanalyticsSharedModule
        };
    }
}
