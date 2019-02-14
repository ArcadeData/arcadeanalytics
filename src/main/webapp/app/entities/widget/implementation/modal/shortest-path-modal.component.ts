import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, Inject } from '@angular/core';

import {Observable, Subject} from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { GraphWidgetComponent } from '../data-widget/graph-widget/graphwidget.component';

@Component({
    selector: 'jhi-shortest-path-popup',
    templateUrl: './shortest-path-modal.component.html',
    styleUrls: ['./shortest-path-modal.component.scss']
})
export class ShortestPathConfigModalComponent implements OnInit, AfterViewInit, OnDestroy {

    config: Object;
    parent: GraphWidgetComponent;
    @Output() shortestPathConfigSave: EventEmitter<Object> = new EventEmitter();

    choosableEdgeClassesNames: string[];
    newInputClass: string;
    newInputProperty: string;
    edgeClassProperties: Object[] = [];

    tableColumns: Object[] = [
        {
            id: 'class',
            text: 'Class',
            width: '30%'
        },
        {
            id: 'weightProperty',
            text: 'Weight Property',
            width: '55%'
        },
        {
            id: 'button',
            text: ''
        }
    ];

    filteredInEdgeClassesNames: string[] = [];
    preselectedEdgeClasses: string[] = [];

    constructor(public modalRef: BsModalRef) {}

    ngOnInit() {}

    ngAfterViewInit() {}

    ngOnDestroy() {}

    initFilteredInEdgeClasses() {
        this.preselectedEdgeClasses = this.config['edgeClassesFilteredIn'];
        this.filteredInEdgeClassesNames = this.config['edgeClassesFilteredIn'];
    }

    updateEdgeClassProperties() {
        this.edgeClassProperties = this.parent.getClassProperties('edge', this.newInputClass);
    }

    addNewEdgeClass() {
        this.config['weightFields'][this.newInputClass] = this.newInputProperty;
        this.newInputClass = undefined;
        this.newInputProperty = undefined;
    }

    removeTimelineClass(className: string) {
        delete this.config['weightFields'][className];
    }

    updateSelectedValues(event) {
        this.filteredInEdgeClassesNames = [];
        for (const currSelectitem of event) {
            this.filteredInEdgeClassesNames.push(currSelectitem['text']);
        }
    }

    save() {
        if (!this.config['allClassesIncluded']) {
            this.config['edgeClassesFilteredIn'] = this.filteredInEdgeClassesNames;
        }
        this.shortestPathConfigSave.emit({config: this.config});
        this.modalRef.hide();
    }
}
