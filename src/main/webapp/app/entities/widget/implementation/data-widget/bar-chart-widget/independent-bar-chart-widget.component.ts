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
import {
    Component, ChangeDetectorRef, NgZone
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';
import { JhiEventManager } from 'ng-jhipster';
import { AbstractBarChartWidgetComponent } from './abstract-bar-char-widget.component';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { IndependentWidget } from '../../independent-widget';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * This component allows a tabular analysis of data fetched from the datasource
 * through queries, full text search, class scan loading.
 */
@Component({
    selector: 'independent-bar-chart-widget',
    templateUrl: './bar-chart-widget.component.html',
    styleUrls: ['./bar-chart-widget.component.scss']
})
export class IndependentBarChartWidgetComponent extends AbstractBarChartWidgetComponent implements IndependentWidget {

    constructor(
        protected ngZone: NgZone,
        protected principal: Principal,
        protected widgetService: WidgetService,
        protected notificationService: NotificationService,
        protected dataSourceService: DataSourceService,
        protected eventManager: JhiEventManager,
        protected cdr: ChangeDetectorRef,
        protected modalService: BsModalService,
        protected base64Service: Base64Service,
        protected widgetEventBusService: WidgetEventBusService,
        protected router: Router) {

        super(ngZone, principal, widgetService, notificationService, dataSourceService, eventManager, cdr, modalService, base64Service, widgetEventBusService, router);
    }

    ngAfterViewInit() {
        this.performAdditionalInit();

        // sidebar height
        if (!this.embedded) {
            this.maxSidebarHeight = this.widgetHeight;
        } else {
            this.adjustWidgetHeightToEmbeddingIframeHeight();
        }
    }

    handleSelectedPropertyModelChanging() {
        this.startSpinner();
        this.multiSeriesMode = false;
        this.updateSettingsSliderUpperValue().subscribe((correctlyUpdated: boolean) => {
            this.performFacetingForWholeDatasource('single');
        });
    }

    runSeriesComputation(mode?: string) {

        if (mode) {
            if (mode === 'single') {
                this.multiSeriesMode = false;
            } else if (mode === 'multi') {
                this.multiSeriesMode = true;
            }
            // executing computation according to the requested mode
            this.performFacetingForWholeDatasource(mode);
        } else {
            // updating according to the last used mode
            if (this.multiSeriesMode) {
                this.performFacetingForWholeDatasource('multi');
            } else {
                this.performFacetingForWholeDatasource('single');
            }
        }
    }

    /**
      * Faceting
      */

    performFacetingForWholeDatasource(mode: string) {

        const classes: string[] = [];
        const fields: string[] = [];
        if (mode === 'single') {
            classes.push(this.selectedClass);
            fields.push(this.selectedProperty);
        } else if (mode === 'multi') {
            for (const currSeriesName of Object.keys(this.multiSeriesName2info)) {
                const currClassMultiSeriesOption = this.multiSeriesName2info[currSeriesName];
                const currClassName = currClassMultiSeriesOption['className'];
                const currPropertyName = currClassMultiSeriesOption['property'];
                if (classes.indexOf(currClassName) < 0) {
                    classes.push(currClassName);
                }
                if (fields.indexOf(currPropertyName) < 0) {
                    fields.push(currPropertyName);
                }
            }
        }

        this.startSpinner();
        if (this.dataSource && this.dataSource['indexing'] &&
            this.dataSource['indexing'].toString() === 'INDEXED') {
            this.widgetService.fetchWholeFacetingForDatasource(this.widget['dataSourceId'], classes, fields, this.minDocCount, this.maxValuesPerField).subscribe((res: Object) => {
                this.currentFaceting = res;
                this.stopSpinner();
                if (!this.multiSeriesMode) {
                    if (this.selectedClass && this.selectedProperty) {
                        this.updateBarChartFromFaceting(res);
                    }
                } else {
                    this.updateBarChartFromFaceting(res);
                }
            }, (err: HttpErrorResponse) => {
                this.handleError(err.error, 'Distribution computation');
            });
        } else {
            this.stopSpinner();
            const message: string = 'No index is defined over the datasource the widget is connected with. Series cannot be computed.';
            this.notificationService.push('warning', 'Series loading', message);
        }
    }

}
