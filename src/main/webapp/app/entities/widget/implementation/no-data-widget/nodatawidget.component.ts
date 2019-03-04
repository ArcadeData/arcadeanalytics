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
import { Input, ChangeDetectorRef } from '@angular/core';
import { WidgetImplementationComponent } from '../widgetimplementation.component';
import { WidgetService } from '../../widget.service';
import { NotificationService, Base64Service, Principal } from '../../../../shared';
import { DataSourceService } from '../../../data-source/data-source.service';
import { JhiEventManager } from 'ng-jhipster';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';

export abstract class NoDataWidgetComponent extends WidgetImplementationComponent {

    constructor(protected principal: Principal,
        protected widgetService: WidgetService,
        protected notificationService: NotificationService,
        protected dataSourceService: DataSourceService,
        protected eventManager: JhiEventManager,
        protected cdr: ChangeDetectorRef,
        protected modalService: BsModalService,
        protected base64Service: Base64Service,
        protected router: Router) {

        super(principal, widgetService, notificationService, dataSourceService, eventManager, cdr, modalService, base64Service, router);

    }

    /*
     * Methods
     */

}
