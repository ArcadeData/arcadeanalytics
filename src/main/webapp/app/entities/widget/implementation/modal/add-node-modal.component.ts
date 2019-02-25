import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { NotificationService } from 'app/shared/services';
import 'rxjs/add/observable/of';
import { WidgetService } from '../..';
import { JhiEventManager } from 'ng-jhipster';

@Component({
    selector: 'jhi-resource-embed-popup',
    templateUrl: './add-node-modal.component.html',
    styleUrls: ['./add-node-modal.component.scss']
})
export class AddNodeModalComponent implements OnInit, AfterViewInit, OnDestroy {

    nodeClassesNames: string[];
    chosenNodeClassName: string;

    constructor(private eventManager: JhiEventManager,
        protected notificationService: NotificationService,
        public modalRef: BsModalRef,
        protected widgetService: WidgetService) { }

    ngOnInit() { }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
    }

    triggerNodeSaving() {
        // trigger the edge-save event
        this.eventManager.broadcast({
            name: 'nodeClassChosenForNewNode',
            nodeClassName: this.chosenNodeClassName,
            action: 'save'
        });

        this.modalRef.hide();
    }

}
