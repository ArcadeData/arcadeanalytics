import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';

import { Dashboard } from './dashboard.model';
import { DashboardService } from './dashboard.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

@Component({
    selector: 'jhi-widget-embed',
    templateUrl: './dashboard-embed.component.html',
    styleUrls: ['./dashboard-embed.component.scss']
})
export class DashboardEmbedComponent implements OnInit, OnDestroy {

    dashboard: Dashboard;
    dashboardLoaded: boolean = false;

    private subscription: Subscription;

    modalRef: BsModalRef;

    constructor(private router: Router,
        private route: ActivatedRoute) {}

    ngOnInit() {
        // get the widgetId from the route
        this.subscription = this.route.queryParams.subscribe((queryParams) => {
            this.load(queryParams['type']);
        });
    }

    load(type: string) {

        const url: string = this.router.routerState.snapshot.url;
        const dashboardUUID: string = url.substring(url.lastIndexOf('/') + 1);
        this.dashboard = new Dashboard();
        this.dashboard['uuid'] = dashboardUUID;
        this.dashboardLoaded = true;
    }

    previousState() {
        window.history.back();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

}
