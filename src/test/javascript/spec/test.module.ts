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
import { NgModule } from '@angular/core';
import { MockBackend } from '@angular/http/testing';
import { Http, BaseRequestOptions } from '@angular/http';
import { JhiLanguageService } from 'ng-jhipster';
import { MockLanguageService } from './helpers/mock-language.service';

@NgModule({
    providers: [
        MockBackend,
        BaseRequestOptions,
        {
            provide: JhiLanguageService,
            useClass: MockLanguageService
        },
        {
            provide: Http,
            useFactory: (backendInstance: MockBackend, defaultOptions: BaseRequestOptions) => {
                return new Http(backendInstance, defaultOptions);
            },
            deps: [MockBackend, BaseRequestOptions]
        }
    ]
})
export class ArcadeanalyticsTestModule {}
