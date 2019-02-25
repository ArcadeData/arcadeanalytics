import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { NotificationService } from 'app/shared/services';
import 'rxjs/add/observable/of';
import { WidgetService } from '../..';

@Component({
    selector: 'jhi-resource-embed-popup',
    templateUrl: './add-node-modal.component.html',
    styleUrls: ['./add-node-modal.component.scss']
})
export class AddNodeModalComponent implements OnInit, AfterViewInit, OnDestroy {

    nodeClassesNames: string[];
    chosenNodeClass: string;

    constructor(protected notificationService: NotificationService,
        public modalRef: BsModalRef,
        protected widgetService: WidgetService) { }

    ngOnInit() { }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
    }

    saveEdge() {
        // save the edge
        // TODO

        this.modalRef.hide();
    }

}
