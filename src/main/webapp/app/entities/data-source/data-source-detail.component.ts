import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';

import { DataSource } from './data-source.model';
import { DataSourceService } from './data-source.service';
import { HttpResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-data-source-detail',
    templateUrl: './data-source-detail.component.html'
})
export class DataSourceDetailComponent implements OnInit, OnDestroy {

    dataSource: DataSource;
    private subscription: Subscription;
    private eventSubscriber: Subscription;

    constructor(
        private eventManager: JhiEventManager,
        private dataSourceService: DataSourceService,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        this.subscription = this.route.params.subscribe((params) => {
            this.load(params['id']);
        });
        this.registerChangeInDataSources();
    }

    load(id) {
        this.dataSourceService.find(id).subscribe((dataSource: DataSource) => {
            this.dataSource = dataSource;
        });
    }
    previousState() {
        window.history.back();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.eventManager.destroy(this.eventSubscriber);
    }

    registerChangeInDataSources() {
        this.eventSubscriber = this.eventManager.subscribe(
            'dataSourceModification',
            (response) => this.load(this.dataSource.id)
        );
    }
}
