import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';

import { DataSet } from './data-set.model';
import { DataSetService } from './data-set.service';
import { HttpResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-data-set-detail',
    templateUrl: './data-set-detail.component.html'
})
export class DataSetDetailComponent implements OnInit, OnDestroy {

    dataSet: DataSet;
    private subscription: Subscription;
    private eventSubscriber: Subscription;

    constructor(
        private eventManager: JhiEventManager,
        private dataSetService: DataSetService,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        this.subscription = this.route.params.subscribe((params) => {
            this.load(params['id']);
        });
        this.registerChangeInDataSets();
    }

    load(id) {
        this.dataSetService.find(id).subscribe((dataSet: DataSet) => {
            this.dataSet = dataSet;
        });
    }
    previousState() {
        window.history.back();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.eventManager.destroy(this.eventSubscriber);
    }

    registerChangeInDataSets() {
        this.eventSubscriber = this.eventManager.subscribe(
            'dataSetListModification',
            (response) => this.load(this.dataSet.id)
        );
    }
}
