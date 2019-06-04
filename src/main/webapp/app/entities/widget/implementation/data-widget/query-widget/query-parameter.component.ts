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
    Component, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges, SimpleChanges,
    ChangeDetectorRef,
    Input,
    Output,
    EventEmitter,
    ViewChild
} from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NotificationService } from '../../../../../shared';
import { JhiEventManager } from 'ng-jhipster';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { WidgetService } from 'app/entities/widget/widget.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SelectComponent } from 'ng2-select';
import { Z_FIXED } from 'zlib';

/**
 * This component is used to render and configure a query paramter
 * inside a query template.
 */
@Component({
    selector: 'query-parameter',
    templateUrl: './query-parameter.component.html',
    styleUrls: ['./query-parameter.component.scss']
})
export class QueryParameterComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges {

    @Input() queryWidgetId;
    @Input() dataSource;
    @Input() name;
    @Input() parameterDef: Object;
    @Input() readMode: boolean;
    @Output() parameterCompliantChange: EventEmitter<Object> = new EventEmitter();
    isParamterDefinitionCompliant: boolean = false;
    parameterPanelCollapsed: boolean = false;

    tmpLabel: string = '';
    labelEditingPopIsOpen: boolean = false;

    dataSourceMetadata: Object;

    @ViewChild(SelectComponent) valueSelectComponent: SelectComponent;

    // ngselect aux vars
    staticDomainDefinition: string;
    activeValues: Object[] = [];

    // faceting, used to define the values' domain through elastic
    faceting: Object;
    classes: string[];
    fields: string[];
    minDocCount: number = 1;
    maxValuesPerField: number = 1000;
    selectedClassProperties: string[] = [];

    panelHeadingHeight: string = '35px';

    constructor(protected notificationService: NotificationService,
        protected dataSourceService: DataSourceService,
        protected eventManager: JhiEventManager,
        protected cdr: ChangeDetectorRef,
        protected modalService: BsModalService,
        protected widgetService: WidgetService) {
    }

    ngOnInit() {
        this.dataSourceService.loadMetadata(this.dataSource['id']).subscribe((dataSourceMetadata: Object) => {
            this.dataSourceMetadata = dataSourceMetadata;

            if (this.parameterDef['domain']['definitionType'] === 'dynamic-faceting') {
                // then we init the selectedClassProperties var
                this.selectedClassProperties = this.getClassProperties(this.parameterDef['domain']['class']);
                this.updateParamDomainFromFaceting();
            }
        }, (error: HttpErrorResponse) => {
            this.handleError(error.error, 'Metadata loading');
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['name'] && changes['parameterDef']) {

            if (!this.parameterDef['label']) {
                // first param loading, then we init the label with the name of the parameter
                this.parameterDef['label'] = changes['name']['currentValue'];
            }

            if (this.parameterDef['domain']['definitionType'] === 'static') {
                // then we init the string we use for the form used to edit the domain
                this.staticDomainDefinition = '';
                this.parameterDef['domain']['set'].forEach((domainValue) => {
                    this.staticDomainDefinition += domainValue + '\n';
                });
            }

            // loading active values for ngselect component
            this.fromStringValueToArray(this.parameterDef['value']).forEach((activeValue) => {
                activeValue = activeValue.replace('"', '').replace('"', '');
                this.activeValues.push({
                    id: activeValue,
                    text: activeValue
                });
            });
        }
    }

    ngOnDestroy() {
        this.detachListenersToValuesSelectDropdownMenu();
    }

    ngAfterViewInit() {
        this.attachListenersToValuesSelectDropdownMenu();
    }

    /**
     * Attaches listeners in order to display values select dropdown menu outside the container with overflow: hidden
     * The dropdown menu position is computed on:
     * - select input click
     * - scroll event inside the window
     */
    attachListenersToValuesSelectDropdownMenu() {

        const selectElementId = '#selected_values_' + this.name;
        const selectInput = (<any>$(selectElementId + ' .ui-select-container'));

        // select input click
        selectInput.click(() => {
            this.selectInputScrollHandler(selectInput, selectElementId);
        });

        // scroll events
        (<any>$('*')).on('scroll', () => {
            this.selectInputScrollHandler(selectInput, selectElementId);
        });
        (<any>$(window)).on('scroll', () => {
            this.selectInputScrollHandler(selectInput, selectElementId);
        });
    }

    /**
     * Detaches listeners in order to display values select dropdown menu outside the container with overflow: hidden
     * The dropdown menu position is computed on:
     * - select input click
     * - scroll event inside the window
     */
    detachListenersToValuesSelectDropdownMenu() {
        const selectElementId = '#selected_values_' + this.name;
        const selectInput = (<any>$(selectElementId + ' .ui-select-container'));

        // select input click
        selectInput.unbind();

        // scroll events
        (<any>$('*')).off('scroll', this.selectInputScrollHandler(selectInput, selectElementId));
        (<any>$(window)).off('scroll', this.selectInputScrollHandler(selectInput, selectElementId));
    }

    selectInputScrollHandler(selectInput, selectElementId) {
        const selectDropdownMenuId = selectElementId + ' .dropdown-menu';
            if (selectInput.get(0)) {
                const coordinates = selectInput.offset();
                const pageYOffset = window.pageYOffset;
                const top = selectInput.outerHeight() + coordinates.top - pageYOffset + 'px';
                const left = coordinates.left;
                (<any>$(selectDropdownMenuId)).css({
                    'position': 'fixed',
                    'top': top,
                    'left': left,
                    'width': selectInput.outerWidth(),
                    'max-height': '150px'
                });
            }
    }

    ngAfterViewChecked() {}

    updateParamLabel() {
        this.parameterDef['label'] = this.tmpLabel;
        this.tmpLabel = '';
        this.labelEditingPopIsOpen = false;
    }

    updateParamDomain() {
        switch (this.parameterDef['domain']['definitionType']) {
            case 'static':  this.updateParamDomainFromStaticDef();
            break;
            case 'dynamic-faceting':    this.updateParamDomainFromFaceting();
            break;
            case 'dynamic-query':   this.updateParamDomainFromQuery();
            break;
        }
    }

    updateParamDomainFromStaticDef() {
        this.parameterDef['domain']['set'] = this.fromStaticStringDomainToArray(this.staticDomainDefinition);

        if (this.parameterDef['domain']['set'].length > 0) {
            setTimeout(() => {
                this.attachListenersToValuesSelectDropdownMenu();
            }, 100);
        }
    }

    fromStaticStringDomainToArray(values: string): string[] {
        return values
            .replace('[', '')
            .replace(']', '')
            .split('\n');
    }

    fromStringValueToArray(values: string): string[] {
        if (values && values.length > 0) {
            return values
                .replace('[', '')
                .replace(']', '')
                .split(',');
        }
        return [];
    }

    updateParamDomainFromFaceting() {
        if (this.dataSource && this.dataSource['indexing'] &&
            this.dataSource['indexing'].toString() === 'INDEXED') {

            if (this.dataSource['id']) {
                const classes: string[] = [this.parameterDef['domain']['class']];
                const fields: string[] = [this.parameterDef['domain']['property']];
                this.widgetService.fetchWholeFacetingForDatasource(this.dataSource['id'], classes, fields, this.minDocCount, this.maxValuesPerField)
                    .subscribe((res: Object) => {
                        this.faceting = res;
                        const facetingClass = this.parameterDef['domain']['class'];
                        const facetingProperty = this.parameterDef['domain']['property'];
                        this.parameterDef['domain']['set'] = Object.keys(this.faceting[facetingClass]['propertyValues'][facetingProperty]);

                        if (this.parameterDef['domain']['set'].length > 0) {
                            setTimeout(() => {
                                this.attachListenersToValuesSelectDropdownMenu();
                            }, 100);
                        }
                    }, (err: HttpErrorResponse) => {
                        this.handleError(err.error, 'Faceting updating');
                    });
            } else {
                // recursive call waiting that datasource id is loaded
                setTimeout(() => {
                    this.updateParamDomainFromFaceting();
                }, 20);
            }
        }
    }

    updateParamDomainFromQuery() {

        const json = {
            query: this.parameterDef['domain']['query'],
            datasetCardinality: 0,
            params: []
        };

        const jsonContent = JSON.stringify(json);
        this.widgetService.loadTabledata(this.queryWidgetId, jsonContent).subscribe((data) => {

            // update domain from data
            const columns = Object.keys(data['nodesClasses']['Table']['properties']);
            if (columns.length > 1) {
                const message = 'Too many columns returned in the resulset, cannot choose which column must to be considered for the domain definition.';
                this.notificationService.push('error', 'Query Domain', message);
            } else {
                this.parameterDef['domain']['set'] = data['nodes'].map((node) => {
                    return node['data']['record'][columns[0]] + '';
                });
            }

            if (this.parameterDef['domain']['set'].length > 0) {
                setTimeout(() => {
                    this.attachListenersToValuesSelectDropdownMenu();
                }, 100);
            }

        }, (error: HttpErrorResponse) => {
            this.handleError(error.error, 'Data loading');
        });
    }

    updateSelectedClassProperties() {
        this.parameterDef['domain']['property'] = undefined;
        this.selectedClassProperties = [];
        if (this.parameterDef['domain']['class']) {
            this.selectedClassProperties = this.getClassProperties(this.parameterDef['domain']['class']);
        } else {
            console.log('Cannot update properties as the selected class seems to be udefined.');
        }
        if (this.selectedClassProperties.length === 0) {
            this.notificationService.push('warning', 'No Property found', 'No property found for the selected class.');
        }
    }

    onParamTypeupdate() {
        this.parameterDef['value'] = '';
        this.activeValues = [];
        if (this.parameterDef['type'] === 'free-text') {
            this.parameterDef['domain'] = {};
        } else {
            if (!this.parameterDef['domain']['set']) {
                this.parameterDef['domain']['set'] = [];
            }

            if (this.parameterDef['domain']['set'] && this.parameterDef['domain']['set'].length > 0) {
                setTimeout(() => {
                    this.attachListenersToValuesSelectDropdownMenu();
                }, 100);
            }
        }

    }

    clearDomainAndValues() {

        this.parameterDef['value'] = '';

        // cleaning select component active values and static domain values
        this.activeValues = [];
        this.staticDomainDefinition = '';

        switch (this.parameterDef['domain']['definitionType']) {
            case 'static':
                this.parameterDef['domain']['set'] = [];
                delete this.parameterDef['domain']['query'];
                delete this.parameterDef['domain']['class'];
                delete this.parameterDef['domain']['property'];
                break;
            case 'dynamic-faceting':
                this.parameterDef['domain']['set'] = [];
                delete this.parameterDef['domain']['query'];
                this.parameterDef['domain']['class'] = undefined;
                this.parameterDef['domain']['property'] = undefined;
                break;
            case 'dynamic-query':
                this.parameterDef['domain']['set'] = [];
                delete this.parameterDef['domain']['class'];
                delete this.parameterDef['domain']['property'];
                this.parameterDef['domain']['query'] = undefined;
                break;
        }
    }

    getClassProperties(className: string): string[] {
        const classProperties: string[] = [];
        const classesMetadata = this.dataSourceMetadata['nodesClasses'];
        if (!classesMetadata) {
            console.error('[getClassProperties] class not found.');
            return;
        }
        for (const propName of Object.keys(classesMetadata[className]['properties'])) {
            classProperties.push(propName);
        }
        return classProperties;
    }

    updateParameterMultipleValue() {
        const currSelectedValues = this.valueSelectComponent.active.map((selectItem) => {
            return selectItem['text'];
        });
        this.parameterDef['value'] = JSON.stringify(currSelectedValues);
    }

    /**
     * Check the settings and return true if the configuration is valid, otherwise false.
     */
    isValid() {
        if (this.parameterDef['type'] && this.parameterDef['value']) {
            return true;
        }
        return false;
    }

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

}
