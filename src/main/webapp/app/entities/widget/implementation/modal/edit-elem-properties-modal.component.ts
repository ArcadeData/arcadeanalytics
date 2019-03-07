import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { BsModalRef, PopoverDirective } from 'ngx-bootstrap';
import { NotificationService } from 'app/shared/services';
import 'rxjs/add/observable/of';
import { WidgetService } from '../..';
import { JhiEventManager } from 'ng-jhipster';

@Component({
    selector: 'jhi-edit-elem-props-modal',
    templateUrl: './edit-elem-properties-modal.component.html',
    styleUrls: ['./edit-elem-properties-modal.component.scss']
})
export class EditElemPropertiesModalComponent implements OnInit, AfterViewInit, OnDestroy {

   element: Object;
   elementType: string;
   newAddingProperty: string;

    constructor(private eventManager: JhiEventManager,
        protected notificationService: NotificationService,
        public modalRef: BsModalRef,
        protected widgetService: WidgetService) { }

    ngOnInit() { }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
    }

    removeProperty(propertyName: string) {
        delete this.element['record'][propertyName];
        this.updateElementView();
    }

    addNewProperty() {
        this.element['record'][this.newAddingProperty] = '';
        this.newAddingProperty = undefined;
        this.updateElementView();
    }

    updateElementView() {
        this.element = JSON.parse(JSON.stringify(this.element));    // make a copy just to update the properties rendering in the view
    }

    invertEdgeDirection() {
        const tmp = this.element['source'];
        this.element['source'] = this.element['target'];
        this.element['target'] = tmp;
    }

    triggerElementUpdating() {

        // trigger the element props update request
        this.eventManager.broadcast({
            name: 'elementPropertiesUpdateRequest',
            toUpdateElement: this.element,
            action: 'update'
        });

        this.modalRef.hide();
    }

}
