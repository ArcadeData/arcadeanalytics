import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { NotificationService } from 'app/shared/services';
import { Subject, Subscription, Observable } from 'rxjs';
import 'rxjs/add/observable/of';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DashboardService, Dashboard } from 'app/entities/dashboard';
import { WidgetService, Widget } from '../..';
import { JhiEventManager } from 'ng-jhipster';

export const enum ShareableResourceType {
    WIDGET = 'Widget',
    DASHBOARD = 'Dashboard'
}

@Component({
    selector: 'jhi-resource-embed-popup',
    templateUrl: './embed-resource-modal.component.html',
    styleUrls: ['./embed-resource-modal.component.scss']
})
export class EmbedResourceModalComponent implements OnInit, AfterViewInit, OnDestroy {

    resource: Object;
    resourceUrl: Subject<string> = new Subject<string>();
    resourceUrlSubscription: Subscription;
    resourceType: ShareableResourceType;
    embeddingIframe: string = '';

    constructor(protected notificationService: NotificationService,
        public modalRef: BsModalRef,
        private location: Location,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private dashboardService: DashboardService,
        protected widgetService: WidgetService,
        private eventManager: JhiEventManager
    ) { }

    ngOnInit() { }

    ngAfterViewInit() {
        this.resourceUrlSubscription = this.resourceUrl.asObservable().subscribe((resourceUrl) => {
            const baseUrl: string = window.location.origin;
            resourceUrl = baseUrl + '/#/' + resourceUrl;
            const iframeId: string = this.resourceType + '_' + this.resource['uuid'];
            this.embeddingIframe = `<iframe id="` + iframeId + `" width="100%" height="400px"
            src="` + resourceUrl + `"
            frameborder="0" allow="picture-in-picture" allowfullscreen></iframe>`;
        });
    }

    ngOnDestroy() {
        this.resourceUrlSubscription.unsubscribe();
    }

    copyToClipboard() {
        (<any>$('#embedding-code')).select();
        document.execCommand('copy');
        this.notificationService.push('info', undefined, 'Code copied to clipboard.');
    }

    updateResourceAccordingToShareFlag() {
        let title: string;
        let message: string;

        if (this.resourceType === ShareableResourceType.WIDGET) {
            this.widgetService.update(<any>this.resource).subscribe(() => {
                if (this.resource['shared']) {
                    title = 'Widget correctly shared';
                    message = 'The widget will be accessible for embedding.';
                } else {
                    title = 'Widget correctly closed';
                    message = 'The widget won\'t be accessible for embedding.';
                }
                this.notificationService.push('success', title, message);
            });
        } else if (this.resourceType === ShareableResourceType.DASHBOARD) {

            const numberOfWidgets = this.resource['widgets'].length;
            let numberOfSuccessfulUpdates: number = 0;
            if (numberOfWidgets > 0) {
                this.resource['widgets'].forEach((widget: Widget) => {
                    widget['shared'] = this.resource['shared'];
                    this.widgetService.update(widget).subscribe(() => {
                        numberOfSuccessfulUpdates++;
                        if (numberOfSuccessfulUpdates === numberOfWidgets) {

                            // triggering dashboard saving
                            this.eventManager.broadcast({
                                name: 'dashboardSharingStatusUpdate',
                                shared: this.resource['shared']
                            });
                        }
                    }, (err) => {
                        title = 'Dashboard sharing failed due to a widget sharing.';
                        message = 'The dashboard won\'t be accessible for embedding.';
                        this.notificationService.push('success', title, message);
                    });
                });
            } else {
                return Observable.of(true);
            }
        }

    }

}
