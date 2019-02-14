import {
    Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChildren, QueryList,
    OnChanges, SimpleChanges, AfterViewInit, ContentChildren
} from '@angular/core';
import { SelectComponent } from 'ng2-select';
import { NotificationService } from '../../../../shared/services/notification.service';
import { WidgetService } from '../../widget.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'filter-menu',
    templateUrl: './filtermenu.component.html',
    styleUrls: ['filtermenu.component.scss']
})
export class FilterMenuComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

    public outerAccordion: string = 'outer-accordion';
    public innerAccordion: string = 'inner-accordion';

    public nodeClasses: Object;
    public currentSelectableItems: string[];

    @Input() datasourceId: number;
    @Input() startingFilters: Object[];
    @Output() resetFiltersEmitter: EventEmitter<Object> = new EventEmitter();
    @Output() filterResultsEmitter: EventEmitter<Object> = new EventEmitter();
    @Output() facetsLoaded: EventEmitter<Object> = new EventEmitter();

    @ViewChildren(SelectComponent) ngSelects: QueryList<SelectComponent>;
    @ContentChildren(SelectComponent) ngSelectsContent: QueryList<SelectComponent>;

    constructor(private widgetService: WidgetService,
        private notificationService: NotificationService) {
    }

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.startingFilters && changes.startingFilters.currentValue.length > 0) {
            this.initActiveFiltersValues(changes.startingFilters.currentValue);
        }
    }

    ngAfterViewInit() { }

    ngOnDestroy() { }

    initActiveFiltersValues(startingFilters: Object[]): any {
        if (this.ngSelects.length > 0) {
            for (const currFilter of this.startingFilters) {
                const className = currFilter['className'];
                const propertyName = currFilter['field'];
                const values = currFilter['values'];

                this.ngSelects.forEach((ngSelectInstance) => {
                    const ngSelectId = ngSelectInstance.element.nativeElement.id;
                    if (ngSelectId.indexOf(className) > 0 && ngSelectId.indexOf(propertyName) > 0) {
                        ngSelectInstance.active = values;
                    }
                });
            }
        } else {
            setTimeout(() => {
                this.initActiveFiltersValues(startingFilters);
            }, 20);
        }
    }

    // maybe we can delete it
    updateCurrentSelectableItems(items) {
        this.currentSelectableItems = Object.keys(items);
    }

    updateFilteringMenu(ids: string[], useEdges?: boolean) {

        // classes and fields not passed as we want to get the whole faceting tree for the current dataset
        const classes =  undefined;
        const fields =  undefined;

        if (this.datasourceId) {
            this.widgetService.fetchFacetsForDataset(this.datasourceId, ids, classes, fields, useEdges).subscribe((res: Object) => {
                this.nodeClasses = res;
            }, (err: HttpErrorResponse) => {
                this.handleError(err.error, 'Filter Menu updating');
            });
        } else {
            // recursive call waiting that datasource id is loaded
            setTimeout(() => {
                this.updateFilteringMenu(ids);
            }, 20);
        }
    }

    filterResetAll() {
        this.resetFiltersEmitter.emit();
        this.resetAllSelectForms();
    }

    resetAllSelectForms() {
        this.ngSelects.forEach((ngSelectInstance) => {
            ngSelectInstance.active = [];
        });
    }

    graphFilterResults(additionalEventInfo) {

        const className = additionalEventInfo['className'];
        const field = additionalEventInfo['field'];

        setTimeout(() => {
            const newEvent: Object = {};
            newEvent['className'] = className;
            newEvent['field'] = field;
            const selector = '#select_' + className + '_' + field + ' .ui-select-match-item span';
            const values = (<any>$(selector)).map(function() {
                return $(this).text();
            }).get();
            newEvent['values'] = values;
            this.filterResultsEmitter.emit(newEvent);
        }, 10);
    }

    handleError(error: any, title: string) {
        const message: string = error.message;
        this.notificationService.push('error', title, message);
    }
}
