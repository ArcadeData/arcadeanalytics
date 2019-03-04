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
import { Widget } from '../widget.model';
import { WidgetService } from '../widget.service';
import { NotificationService, Base64Service, Principal } from '../../../shared/';
import { DataSourceService } from '../../data-source/data-source.service';
import { JhiEventManager } from 'ng-jhipster';
import { BsModalService } from 'ngx-bootstrap/modal';
import { pageContentPadding, pageBottomPaddingForEmbeddingResource } from 'app/global';
import { Router } from '@angular/router';

export abstract class WidgetImplementationComponent {

    @Input() widget: Widget;
    @Input() oldSnapshotToLoad: boolean;
    @Input() minimizedView: boolean;
    @Input() widgetColumnWidth: string;
    @Input() widgetHeight: string;
    @Input() embedded: boolean = this.embedded ? this.embedded : false;
    widgetId: number;

    // spinner
    showSpinner: boolean = false;

    // file name for export
    fileName: string = undefined;

    // sidebar var
    sidebarCollapsed: boolean = false;

    // snapshot to-save check flag
    toSave: boolean = false;
    snapshotLoaded: boolean = false;

    // not shared widget message
    notSharedWidgetMessage: string = 'The widget is not available as not shared anymore or removed by the owner.';

    constructor(protected principal: Principal,
        protected widgetService: WidgetService,
        protected notificationService: NotificationService,
        protected dataSourceService: DataSourceService,
        protected eventManager: JhiEventManager,
        protected cdr: ChangeDetectorRef,
        protected modalService: BsModalService,
        protected base64Service: Base64Service,
        protected router: Router) {

    }

    /*
     * Methods
     */

    abstract loadSnapshot(): void;
    abstract saveAll(): void;

    handleError(error: any, title: string) {
        let message: string = '';
        if (error['detail']) {
            message = error['detail'];
            message = message.substring(0, 300) + ' ...';
        } else if (error['_body']['detail']) {
            message = error['_body']['detail'];
            message = message.substring(0, 300) + ' ...';
        }
        this.notificationService.push('error', title, message);
    }

    startSpinner() {
        // starting the spinner if not running
        if (!this.showSpinner) {
            this.showSpinner = true;
        }
    }

    stopSpinner() {
        // stopping the spinner if running
        if (this.showSpinner) {
            this.showSpinner = false;
        }
    }

    /**
     * Checking the current url:
     * -  embed/widget/ -> widget embedded as single resource  -> widgetHeight resizing needed
     * -  embed/dashboard/ -> widget embedded as resource inside an embedded dashboard  ->  widgetHeight resizing not needed
     */
    adjustWidgetHeightToEmbeddingIframeHeight() {

        if (this.router.routerState.snapshot.url.indexOf('embed/widget/') > 0) {

            (<any>$('#pageContent')).css('padding', '0px');
            $('body').css('height', '100%');
            const closestIframeHeight = $('body').height();

            console.log('iframe height: ' + closestIframeHeight);
            if (closestIframeHeight) {
                // override the widget height according to the iframe height
                this.widgetHeight = closestIframeHeight - (pageContentPadding + pageBottomPaddingForEmbeddingResource) + 'px';
            }
        }
    }
}
