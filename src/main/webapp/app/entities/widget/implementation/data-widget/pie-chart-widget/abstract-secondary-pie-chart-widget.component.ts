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
    OnDestroy, ChangeDetectorRef, NgZone
} from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal, WidgetEventBusService } from '../../../../../shared';
import { JhiEventManager } from 'ng-jhipster';
import { AbstractPieChartWidgetComponent } from './abstract-pie-chart-widget.component';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { SecondaryWidget } from '../../secondary-widget';
import { SubsetSelectionChangeMessage, SubsetSelectionChangeMessageContent,
    DatasetUpdatedMessageContent, DatasetPropagationRequestMessageContent, DatasetPropagationRequestMessage, MessageType } from '../../..';
import { Router } from '@angular/router';
import { WidgetType } from 'app/entities/widget/widget.model';

/**
 * This component allows a tabular analysis of data fetched from the datasource
 * through queries, full text search, class scan loading.
 */
export abstract class AbstractSecondaryPieChartWidgetComponent extends AbstractPieChartWidgetComponent implements SecondaryWidget, OnDestroy {

    datasetUpdatedSubscription: Subscription;

    // dataset
    currentDataset: Object = {
        elements: []
    };

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
        this.subscribeToEventBus();
    }

    ngAfterViewInit() {
        this.performAdditionalInit();

        // sidebar height
        if (!this.embedded) {
            this.maxSidebarHeight = this.widgetHeight;
        } else {
            this.adjustWidgetHeightToEmbeddingIframeHeight();
        }

        if (this.minimizedView) {
            this.requestDatasetPropagation();
        }
    }

    attachPieChartEvents() {

        super.attachPieChartEvents();

        this.pieChart.on('pieselectchanged', (event) => {
            if (this.minimizedView) {
                const class2property: Object[] = [{
                    className: this.selectedClass,
                    property: this.selectedProperty
                }];
                const propertyValues: string[] = [];
                Object.keys(event.selected).forEach((valueProperty) => {
                    if (event.selected[valueProperty] === true) {
                        propertyValues.push(valueProperty);
                    }
                });
                const content: SubsetSelectionChangeMessageContent = {
                    primaryWidgetId: this.widget.primaryWidgetId,
                    secondaryWidgetId: this.widget.id,
                    class2property: class2property,
                    propertyValues: propertyValues
                };
                this.widgetEventBusService.publish(MessageType.SUBSET_SELECTION_CHANGE, new SubsetSelectionChangeMessage(content));
            }
        });
    }

    subscribeToEventBus() {
        this.datasetUpdatedSubscription = this.widgetEventBusService.getMessage(MessageType.DATASET_UPDATED_MESSAGE).subscribe((message) => {
            const content = message.data;
            if (content['primaryWidgetId'] === this.widget['primaryWidgetId']) {
                if (content['secondaryWidgetId']) {
                    // message is directed to just one widget, then check the current instance
                    if (content['secondaryWidgetId'] === this.widget['id']) {
                        this.runDatasetUpdateAfterSnapshotLoading(content);
                    }
                } else {
                    // message is multi cast, then accept the new dataset
                    this.runDatasetUpdateAfterSnapshotLoading(content);
                }
            }
        });
    }

    requestDatasetPropagation() {
        const content: DatasetPropagationRequestMessageContent = {
            primaryWidgetId: this.widget.primaryWidgetId,
            secondaryWidgetId: this.widget.id
        };
        this.widgetEventBusService.publish(MessageType.DATASET_PROPAGATION_REQUEST, new DatasetPropagationRequestMessage(content));
    }

    runDatasetUpdateAfterSnapshotLoading(messageContent: DatasetUpdatedMessageContent) {
        if (this.oldSnapshotToLoad) {
            // wait for snapshot is loaded
            if (this.snapshotLoaded) {
                this.onDatasetUpdate(messageContent['data'], messageContent['metadata']);
            } else {
                setTimeout(() => {
                    this.runDatasetUpdateAfterSnapshotLoading(messageContent);
                }, 20);
            }
        } else {
            this.onDatasetUpdate(messageContent['data'], messageContent['metadata']);
        }
    }

    unsubscribeToEventBus() {
        this.datasetUpdatedSubscription.unsubscribe();
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.dashboardPanelResizedSubscriber);
        this.unsubscribeToEventBus();
    }

    /**
     * Abstract methods
     */
    abstract handleSelectedPropertyModelChanging(): void;
    abstract performSeriesComputationForCurrentDataset(saveAfterUpdate?: boolean): void;

    // @Override
    updatePieChartWidgetFromSnapshot(snapshot) {

        super.updatePieChartWidgetFromSnapshot(snapshot);

        if (snapshot['currentDataset']) {
            this.currentDataset = snapshot['currentDataset'];
        }
    }

    /**
    * Event bus methods
    */

    onDatasetUpdate(data: Object, metadata: Object) {
        this.stopSpinner();

        this.updateWidgetDataset(data);
        this.updateSecondaryMetadataFromPrimaryMetadata(metadata);

        // updating the class properties, as after metadata update could be some properties not present before
        super.updateSelectedClassProperties();

        if (this.widget.type !== WidgetType.SECONDARY_QUERY_PIE_CHART) {
            // if the selected class was removed from the metadata we need to set the selectedClass to undefined
            if (this.selectedClass && !metadata['nodesClasses'][this.selectedClass] && !metadata['edgesClasses'][this.selectedClass]) {
                this.selectedClass = undefined;
                this.selectedProperty = undefined;
            }
        }

        let saved: boolean = false;
        if (this.currentDataset['elements'].length > 0) {
            if (this.selectedClass) {

                if (this.selectedProperty) {
                    this.performSeriesComputationForCurrentDataset(true);
                    saved = true;
                } else {
                    console.log('[PieChartWidget-id: ' + this.widget.id + ']: cannot perform series computation as no properties are selcted.');
                }
            } else {
                console.log('[PieChartWidget-id: ' + this.widget.id + ']: cannot perform series computation as no class are selcted.');
            }
        } else {
            // clean the pie chart
            this.pieChartData = [];
            this.updatePieChart();
        }

        if (!saved && this.principal.hasAnyAuthorityDirect(['ROLE_ADMIN', 'ROLE_EDITOR'])) {
            // even though we did not save the widget as we did not perform the series computation, we have to save the new current dataset and metadata
            this.saveAll(true);
        }
    }

    /**
     * It adds data elements (single vertices and edges)
     * to the instance variables if not present yet.
     * @param data
     */
    updateWidgetDataset(data): void {

        if (data) {

            /*
             * Elements
             */

            // saving class name inside data object and setting 'selectable' with the default value (true)
            data.forEach((elem) => {
                elem['data']['class'] = elem['classes'];
                elem['selectable'] = true; // whether the selection state is mutable (default true)

            });

            this.currentDataset['elements'] = data;
        }
    }

    /**
    * It updates the current metadata for the secondary widget according to the primary widget metadata,
    * by performing some filtering in order to show just info about classes with element in the current dataset.
    * Moreover the cardinalities are changed with the actual number of elements present in the current dataset.
    */
    updateSecondaryMetadataFromPrimaryMetadata(metadata: Object): void {
        this.dataSourceMetadata = metadata;
    }

    /**
     * Auxiliary functions
     */

    // unused
    getAllClassNamesWithElementsInCurrentDataset(): string[] {
        const classNames = new Set();
        this.currentDataset['elements'].forEach((elem) => {
            classNames.add(elem['data']['class']);
        });
        return Array.from(classNames);
    }

    // unused
    getElementsOfClass(className: string, type?: string): string[] {
        const elements: string[] = [];
        let groupType: string;
        if (type) {
            if (type === 'node') {
                groupType = 'nodes';
            } else {
                groupType = 'edges';
            }
        }

        if (groupType) {
            for (const element of this.currentDataset['elements']) {
                if (element['group'] === groupType && element['classes'] === className) {
                    elements.push(element);
                }
            }
        } else {
            for (const element of this.currentDataset['elements']) {
                if (element['classes'] === className) {
                    elements.push(element);
                }
            }
        }
        return elements;
    }

    /**
     * Save
     */

    // saves both data and metadata
    saveAll(hideNotification?: boolean) {

        let infoNotification;
        if (!hideNotification) {
            infoNotification = this.notificationService.push('info', 'Save', 'Saving the widget...', 3000, 'fa fa-spinner fa-spin');
        }
        const delay: number = 10;

        setTimeout(() => {      // just to avoid the saving ops block the first notification message
            const jsonForSnapshotSaving = this.buildSnapshotObject();
            super.callSnapshotSave(jsonForSnapshotSaving, infoNotification);
        }, delay);
    }

    buildSnapshotObject(): Object {

        const jsonForSnapshotSaving = {
            pieChartData: this.pieChartData,
            pieChartLegendData: this.pieChartLegendData,
            pieChartLegendDataSelected: this.pieChartLegendDataSelected,
            currentDataset: this.currentDataset,
            dataSourceMetadata: this.dataSourceMetadata,
            currentFaceting: this.currentFaceting,
            selectedClass: this.selectedClass,
            limitEnabled: this.limitEnabled,
            limitForNodeFetching: this.limitForNodeFetching,
            selectedClassProperties: this.selectedClassProperties,
            selectedProperty: this.selectedProperty,
            showLegend: this.showLegend,
            showLabels: this.showLabels,
            labelPosition: this.labelPosition,
            minDocCount: this.minDocCount,
            maxValuesPerField: this.maxValuesPerField,
            minDocCountSliderUpperValue: this.minDocCountSliderUpperValue,
            maxValuesPerFieldSliderUpperValue: this.maxValuesPerFieldSliderUpperValue
        };

        const perspective: Object = {
            pieChartTabActive: this.pieChartTabActive,
            datasourceTabActive: this.datasourceTabActive,
        };
        jsonForSnapshotSaving['perspective'] = perspective;

        return jsonForSnapshotSaving;
    }

}
