import './vendor.ts';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { NgxWebstorageModule } from 'ngx-webstorage';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './blocks/interceptor/auth.interceptor';
import { AuthExpiredInterceptor } from './blocks/interceptor/auth-expired.interceptor';

import { ArcadeanalyticsCoreModule } from './core';
import { ArcadeanalyticsSharedModule } from './shared';
import { ArcadeanalyticsHomeModule } from './home/home.module';
import { ArcadeanalyticsAdminModule } from './admin/admin.module';
import { ArcadeanalyticsAccountModule } from './account/account.module';
import { ArcadeanalyticsEntityModule } from './entities/entity.module';

import { PaginationConfiguration } from './blocks/config/uib-pagination.config';

import { CookieModule, CookieService } from 'ngx-cookie';

// jhipster-needle-angular-add-module-import JHipster will add new module here

import {
    JhiMainComponent,
    PoweredLabelComponent,
    LayoutRoutingModule,
    NavbarComponent,
    FooterComponent,
    ProfileService,
    PageRibbonComponent,
    ActiveMenuDirective,
    ErrorComponent
} from './layouts';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import * as moment from 'moment';
import { NgJhipsterModule } from 'ng-jhipster';
import { ErrorHandlerInterceptor } from './blocks/interceptor/errorhandler.interceptor';

@NgModule({
    imports: [
        NgJhipsterModule.forRoot({
            // set below to true to make alerts look like toast
            alertAsToast: false,
            alertTimeout: 5000,
            i18nEnabled: true,
            defaultI18nLang: 'en'
        }),
        CookieModule.forRoot(),
        BrowserModule,
        LayoutRoutingModule,
        NgxWebstorageModule.forRoot({ prefix: 'jhi', separator: '-' }),
        ArcadeanalyticsCoreModule,
        ArcadeanalyticsSharedModule.forRoot(),
        ArcadeanalyticsHomeModule,
        ArcadeanalyticsAdminModule,
        ArcadeanalyticsAccountModule,
        ArcadeanalyticsEntityModule,
        // jhipster-needle-angular-add-module JHipster will add new module here
    ],
    declarations: [
        JhiMainComponent,
        PoweredLabelComponent,
        NavbarComponent,
        ErrorComponent,
        PageRibbonComponent,
        ActiveMenuDirective,
        FooterComponent,
    ],
    providers: [
        // Principal,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthExpiredInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorHandlerInterceptor,
            multi: true
        },
        // LoginService,
        // ProfileService,
        // PaginationConfiguration,
        // UserRouteAccessService,
        // CanDeactivateGuard,
        // DenyAccessIfLoggedGuard,
        ...APP_RESOLVER_PROVIDERS
    ],
    bootstrap: [JhiMainComponent]
})
export class ArcadeanalyticsAppModule {
    constructor(
        private dpConfig: NgbDatepickerConfig,
        private _cookieService: CookieService) {

        this.dpConfig.minDate = { year: moment().year() - 100, month: 1, day: 1 };
    }

    getCookie(key: string) {
        return this._cookieService.get(key);
    }
}
