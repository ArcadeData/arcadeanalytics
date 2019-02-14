import { Input, ChangeDetectorRef } from '@angular/core';
import { WidgetImplementationComponent } from '../widgetimplementation.component';
import { WidgetService } from '../../widget.service';
import { NotificationService, Base64Service, Principal } from '../../../../shared';
import { DataSourceService } from '../../../data-source/data-source.service';
import { JhiEventManager } from 'ng-jhipster';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';

export abstract class NoDataWidgetComponent extends WidgetImplementationComponent {

    constructor(protected principal: Principal,
        protected widgetService: WidgetService,
        protected notificationService: NotificationService,
        protected dataSourceService: DataSourceService,
        protected eventManager: JhiEventManager,
        protected cdr: ChangeDetectorRef,
        protected modalService: BsModalService,
        protected base64Service: Base64Service,
        protected router: Router) {

        super(principal, widgetService, notificationService, dataSourceService, eventManager, cdr, modalService, base64Service, router);

    }

    /*
     * Methods
     */

}
