import { Injectable, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { Widget } from './widget.model';
import { WidgetService } from './widget.service';

@Injectable({ providedIn: 'root' })
export class WidgetPopupService {

    private ngbModalRef: BsModalRef;

    constructor(
        private modalService: BsModalService,
        private router: Router,
        private widgetService: WidgetService

    ) {
        this.ngbModalRef = null;
    }

    open(component: Component, widgetId?: number | any, dashboardId?: number | any, hasConnectedWidgets?: string): Promise<BsModalRef> {
        return new Promise<BsModalRef>((resolve, reject) => {
            const isOpen = this.ngbModalRef !== null;
            if (isOpen) {
                if (dashboardId) {
                    this.ngbModalRef.content.currentDashboardId = dashboardId;
                }
                resolve(this.ngbModalRef);
            }

            if (widgetId) {
                this.widgetService.find(widgetId).subscribe((widget: Widget) => {
                    this.ngbModalRef = this.widgetModalRef(component, widget);
                    if (dashboardId) {
                        this.ngbModalRef.content.currentDashboardId = dashboardId;
                    }
                    if (hasConnectedWidgets !== undefined) {
                        this.ngbModalRef.content.hasConnectedWidgets = hasConnectedWidgets === 'true' ? true : false;
                    }
                    resolve(this.ngbModalRef);
                });
            } else {
                // setTimeout used as a workaround for getting ExpressionChangedAfterItHasBeenCheckedError
                setTimeout(() => {
                    if (dashboardId) {
                        const widget = new Widget();
                        widget.dashboardId = dashboardId;
                        this.ngbModalRef = this.widgetModalRef(component, widget);
                    } else {
                        this.ngbModalRef = this.widgetModalRef(component, new Widget());
                    }
                    if (dashboardId) {
                        this.ngbModalRef.content.currentDashboardId = dashboardId;
                    }
                    resolve(this.ngbModalRef);
                }, 0);
            }
        });
    }

    widgetModalRef(component: Component, widget: Widget): BsModalRef {
        const modalRef = this.modalService.show(component);
        modalRef.content.widget = widget;
        this.modalService.onHide.subscribe((result) => {
            this.router.navigate([{ outlets: { popup: null } }], { replaceUrl: true });
            this.ngbModalRef = null;
        }, (reason) => {
            this.router.navigate([{ outlets: { popup: null } }], { replaceUrl: true });
            this.ngbModalRef = null;
        });

        return modalRef;
    }
}
