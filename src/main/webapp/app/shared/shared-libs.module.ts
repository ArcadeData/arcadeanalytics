import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgJhipsterModule } from 'ng-jhipster';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AccordionModule, CollapseModule, ModalModule, BsDropdownModule,
    PopoverModule, TooltipModule, PaginationModule, TabsModule } from 'ngx-bootstrap';
import { NouisliderModule } from 'ng2-nouislider';
import { ColorPickerModule } from 'ngx-color-picker';
import { DragulaModule } from 'ng2-dragula';
import { UiSwitchModule } from 'ngx-ui-switch';
import { FileUploadModule } from 'ng2-file-upload';
import { SelectModule } from 'ng2-select';
import { CKEditorModule } from './editor/ckeditor.module';
import { DateValueAccessorModule } from 'angular-date-value-accessor';
import { CookieModule } from 'ngx-cookie';

@NgModule({
    // declarations: [
    //     UiSwitchModule
    // ],
    imports: [
        NgJhipsterModule.forRoot(<any>{
            // set below to true to make alerts look like toast
            alertAsToast: false,
            i18nEnabled: true,
            defaultI18nLang: 'en'
        }),
        CookieModule.forRoot(),
        InfiniteScrollModule,
        AccordionModule.forRoot(),
        CollapseModule.forRoot(),
        BsDropdownModule.forRoot(),
        PopoverModule.forRoot(),
        TooltipModule.forRoot(),
        ModalModule.forRoot(),
        PaginationModule.forRoot(),
        TabsModule.forRoot(),
        ColorPickerModule,
        DragulaModule.forRoot(),
        UiSwitchModule.forRoot({
            size: 'small',
            // checkedLabel: 'on',
            // uncheckedLabel: 'off'
          }),
        FileUploadModule,
        SelectModule,
        CKEditorModule,
        DateValueAccessorModule
    ],
    exports: [
        FormsModule,
        CommonModule,
        AccordionModule,
        CollapseModule,
        BsDropdownModule,
        PopoverModule,
        TooltipModule,
        ModalModule,
        PaginationModule,
        TabsModule,
        ColorPickerModule,
        DragulaModule,
        NgJhipsterModule,
        InfiniteScrollModule,
        NouisliderModule,
        UiSwitchModule,
        FileUploadModule,
        SelectModule,
        CKEditorModule,
        DateValueAccessorModule
    ]
})
export class ArcadeanalyticsSharedLibsModule {
    static forRoot() {
        return {
            ngModule: ArcadeanalyticsSharedLibsModule
        };
    }
}
