import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, Inject } from '@angular/core';

import {Observable, Subject} from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { GraphWidgetComponent } from '../data-widget/graph-widget/graphwidget.component';

@Component({
    selector: 'jhi-shortest-path-popup',
    templateUrl: './centrality-modal.component.html',
    styleUrls: ['./centrality-modal.component.scss']
})
export class CentralityConfigModalComponent implements OnInit, AfterViewInit, OnDestroy {

    config: Object;
    parent: GraphWidgetComponent;
    @Output() centralityConfigSave: EventEmitter<Object> = new EventEmitter();

    choosableEdgeClassesNames: string[];
    choosableNodeClassesNames: string[];
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

    filteredInNodeClassesNames: string[] = [];
    preselectedNodeClasses: string[] = [];

    constructor(public modalRef: BsModalRef) {}

    ngOnInit() {}

    ngAfterViewInit() {}

    ngOnDestroy() {}

    initFilteredInNodeClasses() {
        this.preselectedNodeClasses = this.config['nodeClassesFilteredIn'];
        this.filteredInNodeClassesNames = this.config['nodeClassesFilteredIn'];
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
        this.filteredInNodeClassesNames = [];
        for (const currSelectitem of event) {
            this.filteredInNodeClassesNames.push(currSelectitem['text']);
        }
    }

    save() {
        if (!this.config['allClassesIncluded']) {
            this.config['nodeClassesFilteredIn'] = this.filteredInNodeClassesNames;
        }
        this.centralityConfigSave.emit({config: this.config});
        this.modalRef.hide();
    }
}
