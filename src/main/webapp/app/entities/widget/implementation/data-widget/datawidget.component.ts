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
import { ChangeDetectorRef } from '@angular/core';
import { WidgetImplementationComponent } from '../widgetimplementation.component';
import { WidgetService } from '../../widget.service';
import { NotificationService, Base64Service, WidgetEventBusService, Principal } from '../../../../shared';
import { DataSourceService } from '../../../data-source/data-source.service';
import { JhiEventManager } from 'ng-jhipster';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DataSource } from '../../../data-source/data-source.model';
import { Subject, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

export abstract class DataWidgetComponent extends WidgetImplementationComponent {

    // datasource
    dataSource: DataSource;
    dataSourceMetadata: Object;
    // time window for datasource indexing status check
    DATASOURCE_INDEXING_CHECK_WINDOW = 10 * 1000;

    dashboardPanelResizedSubscriber: Subscription;

    // full text search
    searchTerm = new Subject<string>();
    searchTermObserver;      // observer to search
    lastEmittedSearchTerm: string;
    renderFullTextSearchView: boolean = false;

    // search
    inputSearch: string;

    // user role
    userAuthorities: string[];
    userIsAdmin: boolean;

    maxElementsByContract: number;
    maxNumberOfElementsReachedAlert: string = `The maximum number of elements for the current widget was already reached.
                                                If you want to load some fresh data you have to delete some elements.`;

    // messages
    datasourceAlertMessage: string = `No index is defined over the datasource the widget is connected with.
     The widget will not work properly till an index will be defined.`;
    datasourceAlertMessageMustBeShown: boolean = false;

    constructor(protected principal: Principal,
        protected widgetService: WidgetService,
        protected notificationService: NotificationService,
        protected dataSourceService: DataSourceService,
        protected eventManager: JhiEventManager,
        protected cdr: ChangeDetectorRef,
        protected modalService: BsModalService,
        protected base64Service: Base64Service,
        protected widgetEventBusService: WidgetEventBusService,
        protected router: Router) {

        super(principal, widgetService, notificationService, dataSourceService, eventManager, cdr, modalService, base64Service, router);

    }

    /*
     * Methods
     */

    initParamsDependingOnUserIdentities() {

        // user role init
        this.userAuthorities = this.principal['userIdentity']['authorities'];
        if (this.userAuthorities.indexOf('ROLE_ADMIN') >= 0) {
            this.userIsAdmin = true;
        } else {
            this.userIsAdmin = false;
        }
        // updating datasource indexing message according to current user authorities
        if (this.userAuthorities.indexOf('ROLE_EDITOR') >= 0 || this.userAuthorities.indexOf('ROLE_ADMIN') >= 0) {
            this.datasourceAlertMessage += '<br/><br/>';
            this.datasourceAlertMessage += '<button type="button" class="btn btn-sm btn-primary indexDatasourceButton">';
            this.datasourceAlertMessage += '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp';
            this.datasourceAlertMessage += '<span>Index Datasource</span>';
            this.datasourceAlertMessage += '</button>';
        } else {
            this.datasourceAlertMessage += '<br/><br/>';
            this.datasourceAlertMessage += '<button type="button" class="btn btn-sm btn-primary" disabled>';
            this.datasourceAlertMessage += '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp';
            this.datasourceAlertMessage += '<span>Index Datasource</span>';
            this.datasourceAlertMessage += '</button>';
        }

        // max elements init
        this.maxElementsByContract = this.principal['userIdentity']['contract']['maxElements'];
    }

    callDatasourceIndexing() {
        this.widgetService.callDatasourceIndexing(this.dataSource['id']).subscribe((res: Object) => {
            const message: string = 'Indexing started.\nYou can perform a search also during the indexing process on the partial indexed data.';
            this.notificationService.push('success', 'Full Text Index', message);

            this.checkDatasourceIndexingStatus();
        }, (error: HttpErrorResponse) => {
            this.handleError(error.error, 'Datasource indexing');
        });
    }

    checkDatasourceIndexingStatus() {
        this.dataSourceService.find(this.widget['dataSourceId']).subscribe((dataSource: DataSource) => {
            this.dataSource = dataSource;
            if (this.dataSource['indexing'].toString() !== 'INDEXED') {
                // wait for a while and check again
                setTimeout(() => {
                    this.checkDatasourceIndexingStatus();
                }, this.DATASOURCE_INDEXING_CHECK_WINDOW);
            } else {
                // check completed, notify the user about the new datasource indexing status
                const message: string = 'Datasource indexing completed.';
                this.notificationService.push('success', 'Full Text Index', message);
                this.performOperationsAfterIndexingComplete();
            }
        });
    }

    checkDatasourceIndexingAlert() {
        if (!this.dataSource.indexing) {
            this.datasourceAlertMessageMustBeShown = true;
        } else {
            if (this.dataSource.indexing.toString() === 'NOT_INDEXED') {
                this.datasourceAlertMessageMustBeShown = true;
            } else {
                this.datasourceAlertMessageMustBeShown = false;
            }
        }

        if (!this.minimizedView && this.datasourceAlertMessageMustBeShown) {
            const notification = this.notificationService.push('warning', 'DataSource Index', this.datasourceAlertMessage);
            // adding button reaction if button is enabled
            $('.indexDatasourceButton').fadeIn(() => {
                (<any>$('.indexDatasourceButton')).click(() => {
                    notification.close();
                    this.callDatasourceIndexing();
                });
            });
        }

    }

    /**
     * Search functions
     */

    // FULL TEXT SEARCH (ELASTIC SEARCH ON DATASOURCE)
    renderFullTextSearch() {
        if (!this.renderFullTextSearchView) {
            this.renderFullTextSearchView = true;
        }
    }

    updateFullTextSearchRendering() {
        if (!this.lastEmittedSearchTerm) {
            this.renderFullTextSearchView = false;
        } else if (this.lastEmittedSearchTerm.length === 0) {
            this.renderFullTextSearchView = false;
        }
    }

    resetFullTextSearch(buttonFocus?: boolean) {
        // cleaning the searchTerm subject
        this.searchTerm.next('');

        // cleaning the input value
        (<any>$('#fullTextSearchInput')).val('');

        this.updateFullTextSearchRendering();

        if (buttonFocus) {
            (<any>$('#fullTextSearchClear')).blur();    // taking fous out of search input text
            (<any>$('#indexButton')).focus();   // focusing on the 'index datasource' button
        }
    }

    /**
     * Abstract method implemented by each specific widget performing all the operations that must be performed after the indexing process completion.
     */
    abstract performOperationsAfterIndexingComplete(): void;

    cleanDatasourceMetadataForSecondaryWidget(dataSourceMetadata: Object, elements: Object[]): Object {
        const cleanedDatasourceMetadata: Object = {
            nodesClasses: {},
            edgesClasses: {}
        };

        if (elements && elements.length > 0) {

            if (!dataSourceMetadata['nodesClasses'] && !dataSourceMetadata['edgesClasses']) {
                console.log('WARNING: No nodesClasses or edgesClasses are present in the metadata.');
                return cleanedDatasourceMetadata;
            }

            if (dataSourceMetadata['nodesClasses']) {

                for (const currNodeClassName of Object.keys(dataSourceMetadata['nodesClasses'])) {

                    // filtering elements of the current class names and filtering out all the hidden elements
                    const currClassElements = elements.filter((currElement) => {
                        if (currElement['classes'].indexOf(currNodeClassName) >= 0 && !currElement['data']['hidden']) {
                            return true;
                        }
                        return false;
                    });

                    const currClassCardinality = currClassElements.length;
                    if (currClassCardinality > 0) {
                        const currNodeClassMetadata = dataSourceMetadata['nodesClasses'][currNodeClassName];
                        const currNodeClassMetadataCopy = Object.assign({}, currNodeClassMetadata);
                        currNodeClassMetadataCopy['cardinality'] = currClassCardinality;
                        cleanedDatasourceMetadata['nodesClasses'][currNodeClassName] = currNodeClassMetadataCopy;
                    }
                }
            }

            if (dataSourceMetadata['edgesClasses']) {

                for (const currEdgeClassName of Object.keys(dataSourceMetadata['edgesClasses'])) {

                    // filtering elements of the current class names and filtering out all the hidden elements
                    const currClassElements = elements.filter((currElement) => {
                        if (currElement['classes'].indexOf(currEdgeClassName) >= 0 && !currElement['data']['hidden']) {
                            return true;
                        }
                        return false;
                    });

                    const currClassCardinality = currClassElements.length;
                    if (currClassCardinality > 0) {
                        const currEdgeClassMetadata = dataSourceMetadata['edgesClasses'][currEdgeClassName];
                        const currEdgeClassMetadataCopy = Object.assign({}, currEdgeClassMetadata);
                        currEdgeClassMetadataCopy['cardinality'] = currClassCardinality;
                        cleanedDatasourceMetadata['edgesClasses'][currEdgeClassName] = currEdgeClassMetadataCopy;
                    }
                }
            }
        }

        return cleanedDatasourceMetadata;
    }

}

export const enum FetchingMode {
    LOAD_FROM_CLASS,
    TRAVERSE,
    LOAD_FROM_IDS,
    QUERY
}
