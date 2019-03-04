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
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';

import { Widget, WidgetType } from './widget.model';
import { WidgetService } from './widget.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

@Component({
    selector: 'jhi-widget-embed',
    templateUrl: './widget-embed.component.html',
    styleUrls: ['./widget-embed.component.scss']
})
export class WidgetEmbedComponent implements OnInit, OnDestroy {

    widget: Widget;
    widgetLoaded: boolean = false;

    private subscription: Subscription;

    modalRef: BsModalRef;

    constructor(private router: Router,
        private route: ActivatedRoute) {}

    ngOnInit() {
        // get the widgetId from the route
        this.subscription = this.route.queryParams.subscribe((queryParams) => {
            this.load(queryParams['type']);
        });
    }

    load(type: string) {

        let url: string = this.router.routerState.snapshot.url;
        url = url.substring(url.lastIndexOf('/') + 1);
        const widgetUUID: string = url.substring(0, url.lastIndexOf('?'));
        this.widget = new Widget();
        this.widget['uuid'] = widgetUUID;
        let widgetType;
        switch (type) {
            case 'graph':
            widgetType = WidgetType.GRAPH;
            break;
            case 'text-editor':
            widgetType = WidgetType.TEXTEDITOR;
            break;
            case 'table':
            widgetType = WidgetType.TABLE;
            break;
            case 'independent-pie-chart':
            widgetType = WidgetType.INDEPENDENT_PIE_CHART;
            break;
            case 'independent-bar-chart':
            widgetType = WidgetType.INDEPENDENT_BAR_CHART;
            break;
            case 'secondary-pie-chart':
            widgetType = WidgetType.SECONDARY_PIE_CHART;
            break;
            case 'secondary-bar-chart':
            widgetType = WidgetType.SECONDARY_BAR_CHART;
            break;
        }
        this.widget['type'] = widgetType;
        this.widget['hasSnapshot'] = true;
        this.widgetLoaded = true;
    }

    previousState() {
        window.history.back();
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

}
