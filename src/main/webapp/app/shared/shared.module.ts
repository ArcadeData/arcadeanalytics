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
