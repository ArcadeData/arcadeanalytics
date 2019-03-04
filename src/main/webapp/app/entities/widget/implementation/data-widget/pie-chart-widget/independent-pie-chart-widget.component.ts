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
import { BsModalService } from 'ngx-bootstrap/modal';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';
import { JhiEventManager } from 'ng-jhipster';
import { AbstractPieChartWidgetComponent } from './abstract-pie-chart-widget.component';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { IndependentWidget } from '../../independent-widget';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * This component allows a tabular analysis of data fetched from the datasource
 * through queries, full text search, class scan loading.
 */
@Component({
    selector: 'independent-pie-chart-widget',
    templateUrl: './pie-chart-widget.component.html',
    styleUrls: ['./pie-chart-widget.component.scss']
})
export class IndependentPieChartWidgetComponent extends AbstractPieChartWidgetComponent implements IndependentWidget {

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
        this.updateSettingsSliderUpperValue().subscribe((correctlyUpdated: boolean) => {
                this.performFacetingForWholeDatasource();
        });
    }

    runSeriesComputation() {
        this.performFacetingForWholeDatasource();
    }

    /**
      * Faceting
      */

    performFacetingForWholeDatasource() {

        const classes: string[] = [this.selectedClass];
        const fields: string[]  = [this.selectedProperty];
        this.startSpinner();
        if (this.dataSource && this.dataSource['indexing'] &&
            this.dataSource['indexing'].toString() === 'INDEXED') {
            this.widgetService.fetchWholeFacetingForDatasource(this.widget['dataSourceId'], classes, fields, this.minDocCount, this.maxValuesPerField).subscribe((res: Object) => {
                this.currentFaceting = res;
                this.stopSpinner();
                if (this.selectedClass && this.selectedProperty) {
                    this.updatePieChartFromFaceting(res);
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
