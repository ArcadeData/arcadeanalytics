import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { NotificationService } from 'app/shared/services';
import { WidgetService } from '../..';
import { JhiEventManager } from 'ng-jhipster';
import { Subject } from 'rxjs';

@Component({
    selector: 'jhi-direct-add-edge-modal',
    templateUrl: './direct-add-edge-modal.component.html',
    styleUrls: ['./direct-add-edge-modal.component.scss']
})
export class DirectAddEdgeModalComponent implements OnInit, AfterViewInit, OnDestroy {

    subject: Subject<boolean>;
    sourceNode: any;
    targetNode: any;

    constructor(private eventManager: JhiEventManager,
        protected notificationService: NotificationService,
        public modalRef: BsModalRef,
        protected widgetService: WidgetService) { }

    ngOnInit() { }

    ngAfterViewInit() {}

    ngOnDestroy() {}

    action(choice: boolean) {
        this.subject.next(choice);    // we set always true as we have to leave the widget (canDeactivate call need true)
        this.subject.complete();
        this.modalRef.hide();
    }

}
