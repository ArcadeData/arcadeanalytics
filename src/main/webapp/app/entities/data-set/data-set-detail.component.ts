/*-
 * #%L
 * Arcade Analytics
 * %%
 * Copyright (C) 2018 - 2019 ArcadeAnalytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
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
