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
    ChangeDetectorRef, Input, Output, EventEmitter
} from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import * as $ from 'jquery';
import { JhiEventManager } from 'ng-jhipster';

@Component({
    selector: 'table-data',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges {

    // table container height
    @Input() tableContainerTotalHeight: string;
    headerHeight: string = '41px';
    tableHeight: string;

    // table data
    @Input() inputElements: Object[] = this.inputElements ? this.inputElements : [];    // optional input field, if passed is used to automatically update
                                                                                        // the table when the input elements change, otherwise the table must be manually
                                                                                        // updated through the setData method
    @Input() inputColumns: Object[];
    @Input() deletionEnabled: boolean = this.deletionEnabled ? this.deletionEnabled : false;
    @Input() selectionEnabled: boolean = this.selectionEnabled ? this.selectionEnabled : false;
    @Output() elementUnselection: EventEmitter<Object> = new EventEmitter();
    @Output() elementSelection: EventEmitter<Object> = new EventEmitter();
    @Output() elementDeletion: EventEmitter<Object> = new EventEmitter();
    @Output() inputDataChange: EventEmitter<Object> = new EventEmitter();

    columnsNames: string[];
    columnName2sortingStatus: Object;

    // class name column config control (global for all classes)
    @Input() classNameColumnIncluded: boolean = this.classNameColumnIncluded ? this.classNameColumnIncluded : true;
    classNameColumnSortingStatus: string = SortingStatus.NOT_SORTED;

    // class name column config control (global for all classes)
    selectionColumnSortingStatus: string = SortingStatus.NOT_SORTED;

    // pagination config
    @Input() itemsPerPage: number = this.itemsPerPage ? this.itemsPerPage : 15;
    totalItems: any;
    page: any = 1;
    pageElements: Object[];

    constructor(private eventManager: JhiEventManager,
        private cdr: ChangeDetectorRef,
        private modalService: BsModalService) {
            this.columnsNames = [];
            this.columnName2sortingStatus = {};
        }

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['tableContainerTotalHeight']) {
            this.updateTableHeight(this.tableContainerTotalHeight);
        }
        if (changes['inputElements']) {
            this.cleanInputElements();
            this.totalItems = this.inputElements.length;
            this.reloadCurrentPage();
        }
        if (changes['inputColumns']) {
            this.updateUniqueColumnsNames();
        }
        this.inputDataChange.emit();
    }

    ngOnDestroy() { }

    ngAfterViewInit() {
        // possible overflow handling
        this.tooltipOnOverflow();
    }

    ngAfterViewChecked() {}

    updateTableHeight(tableContainerHeight: string) {
        const totalHeight: number = parseInt(tableContainerHeight.replace('px', ''), 10);
        const headerNumericHeight: number = parseInt(this.headerHeight, 10);
        this.tableHeight = (totalHeight - headerNumericHeight) + 'px';
    }

    /**
     * Set Data API.
     */
    setData(elements: Object[]) {
        this.inputElements = elements;

        this.cleanInputElements();
        this.totalItems = this.inputElements.length;
        this.reloadCurrentPage();

        this.inputDataChange.emit();
    }

    /**
     * It cleans the input elements removing from the collection all the elements having:
     * - hidden attribute equal true
     */
    cleanInputElements() {
        this.inputElements = this.inputElements.filter((currElem) => {
            if (currElem['data']['hidden']) {
                return false;
            }
            return true;
        });
    }

    /**
     * It updates the unique column names set used as for the table headers according to the current input columns.
     */
    updateUniqueColumnsNames() {
        this.columnsNames = [];
        this.columnName2sortingStatus = {};
        for (const inputColumn of this.inputColumns) {
            const columnName = inputColumn['name'];
            if (!columnName.startsWith('@') && inputColumn['included']) {
                if (this.columnsNames.indexOf(columnName) < 0) {
                    this.columnsNames.push(columnName);
                    this.columnName2sortingStatus[columnName] = SortingStatus.NOT_SORTED;
                }
            }
        }
        this.columnsNames.sort();
    }

    tooltipOnOverflow() {
        (<any>$('.mightOverflow')).bind('mouseover', function() {
            const $this = $(this);
            const width = (<any>$('span')).width();
            if (this.offsetWidth > width && !$this.attr('title')) {
                $this.attr('title', $this.text());
            }
        });
    }

    updateNumberOfItemsPerPage(itemsPerPage: number) {
        this.itemsPerPage = itemsPerPage;
        this.reloadCurrentPage();
    }

    /**
     * Editing Output Events
     */

    deleteElementById(elementId: string) {
        this.elementDeletion.emit({ toDelElementId: elementId });
    }

    handleSelectionCheckboxElement(element: Object) {
        if (element['selected']) {
            this.elementSelection.emit({ toSelElementId: element['data']['id'] });
        } else {
            this.elementUnselection.emit({ toUnselElementId: element['data']['id'] });
        }
    }

    /**
     * Sorting
     */

    sortInputElementsBySelectionColumn(sortingOrder: string) {
        const property = '@selection';
        this.sortInputElementsByProperty(sortingOrder, property);
    }

    sortInputElementsByClassColumn(sortingOrder: string) {
        const property = '@className';
        this.sortInputElementsByProperty(sortingOrder, property);
    }

    sortInputElementsByProperty(sortingOrder: string, propertyName: string) {

        let newSortingStatus: SortingStatus;
        if (sortingOrder === 'asc') {
            newSortingStatus = SortingStatus.SORTED_ASC;
            this.sortInputElementsByPropertyAsc(propertyName);
        } else if (sortingOrder === 'desc') {
            newSortingStatus = SortingStatus.SORTED_DESC;
            this.sortInputElementsByPropertyDesc(propertyName);
        }

        // reloading the page
        this.reloadCurrentPage();

        // updating sorting status
        if (propertyName === '@className') {
            this.classNameColumnSortingStatus = newSortingStatus;
            for (const column of this.inputColumns) {
                if (column['sortingStatus'] !== 'NOT_SORTED') {
                    this.updateSortingStatusForColumn(column['name'], SortingStatus.NOT_SORTED);
                }
            }
            this.selectionColumnSortingStatus = SortingStatus.NOT_SORTED;
        } else if (propertyName === '@selection') {
            this.selectionColumnSortingStatus = newSortingStatus;
            for (const column of this.inputColumns) {
                if (column['sortingStatus'] !== 'NOT_SORTED') {
                    this.updateSortingStatusForColumn(column['name'], SortingStatus.NOT_SORTED);
                }
            }
            this.classNameColumnSortingStatus = SortingStatus.NOT_SORTED;
        } else {
            for (const column of this.inputColumns) {
                if (column['sortingStatus'] !== 'NOT_SORTED') {
                    this.updateSortingStatusForColumn(column['name'], SortingStatus.NOT_SORTED);
                }
            }
            this.updateSortingStatusForColumn(propertyName, newSortingStatus);
            this.selectionColumnSortingStatus = SortingStatus.NOT_SORTED;
            this.classNameColumnSortingStatus = SortingStatus.NOT_SORTED;
        }

    }

    sortInputElementsByPropertyAsc(propertyName: string) {
        this.inputElements = this.inputElements.sort((elem1, elem2) => {
            if (propertyName === '@className') {
                if (elem1['data']['class'] < elem2['data']['class']) {
                    return -1;
                } else if (elem1['data']['class'] > elem2['data']['class']) {
                    return 1;
                } else {
                    return 0;
                }
            } else if (propertyName === '@selection') {
                if (elem1['selected'] && !elem2['selected']) {
                    return -1;
                } else if (!elem1['selected'] && elem2['selected']) {
                    return 1;
                } else {
                    return 0;
                }
            } else {
                let elem1Value = elem1['data']['record'][propertyName];
                let elem2Value = elem2['data']['record'][propertyName];
                if (!isNaN(new Date(elem1Value).getTime()) && !isNaN(new Date(elem2Value).getTime())) {
                    // then th e two values must be compared as dates
                    elem1Value = new Date(elem1Value);
                    elem2Value = new Date(elem2Value);
                }
                if (!elem2Value || elem1Value < elem2Value) {
                    return -1;
                } else if (!elem1Value || elem1Value > elem2Value) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });
    }

    sortInputElementsByPropertyDesc(propertyName: string) {
        this.sortInputElementsByPropertyAsc(propertyName);
        this.inputElements = this.inputElements.reverse();
    }

    updateSortingStatusForColumn(propertyName: string, newSortingStatus: SortingStatus) {
        this.columnName2sortingStatus[propertyName] = newSortingStatus;
    }

    /**
     * Pagination
     */
    loadPage(pageNumber: number) {
        this.page = pageNumber;
        const startingIndex: number = (this.page - 1) * this.itemsPerPage;    // included
        const endingIndex: number = this.page * this.itemsPerPage;    // excluded
        this.updatePageElements(startingIndex, endingIndex);
    }

    reloadCurrentPage() {
        const startingIndex: number = (this.page - 1) * this.itemsPerPage;    // included
        const endingIndex: number = this.page * this.itemsPerPage;    // excluded
        this.updatePageElements(startingIndex, endingIndex);
    }

    updatePageElements(startingIndex: number, endingIndex: number) {
        this.pageElements = this.inputElements.slice(startingIndex, endingIndex);
    }

    /**
     * Export
     */
    getTableAsCSV(): string {

        let csv: string;
        let headerLine: string = undefined;
        if (this.classNameColumnIncluded) {
            headerLine = '"Class Name",';
        }
        for (const property of this.inputColumns) {
            if (!property['name'].startsWith('@') && property['included']) {
                headerLine += '"' + property['name'] + '",';
            }
        }
        headerLine = headerLine.substring(0, headerLine.length - 1);
        csv = headerLine + '\r\n';

        let currLine: string;
        for (const currElement of this.inputElements) {
            currLine = '';
            if (this.classNameColumnIncluded) {
                currLine = '"' + currElement['data']['class'] + '",';
            }
            for (const currProperty of this.inputColumns) {
                if (!currProperty['name'].startsWith('@') && currProperty['included']) {
                    let value = '"' + currElement['data']['record'][currProperty['name']];
                    if (!value) {
                        value = '';
                    }
                    currLine += value + '",';
                }
            }
            currLine = currLine.substring(0, currLine.length - 1);
            csv += currLine + '\r\n';
        }

        return csv;
    }
}

export const enum SortingStatus {
    NOT_SORTED = 'NOT_SORTED',
    SORTED_ASC = 'SORTED_ASC',
    SORTED_DESC = 'SORTED_DESC'
}
