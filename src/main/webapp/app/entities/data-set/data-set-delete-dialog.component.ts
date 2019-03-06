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

import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { DataSet } from './data-set.model';
import { DataSetPopupService } from './data-set-popup.service';
import { DataSetService } from './data-set.service';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Used for 'delete-data-set' workflow.
 */
@Component({
    selector: 'jhi-data-set-delete-dialog',
    templateUrl: './data-set-delete-dialog.component.html'
})
export class DataSetDeleteDialogComponent {

    dataSet: DataSet;

    constructor(
        private dataSetService: DataSetService,
        public bsModalRef: BsModalRef,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    clear() {
        this.bsModalRef.hide();
    }

    confirmDelete(id: number) {
        this.dataSetService.delete(id).subscribe((response) => {
                this.eventManager.broadcast({
                    name: 'dataSetListModification',
                    content: 'Deleted a dataSet'
                });
                this.bsModalRef.hide();
            },
            (error: HttpErrorResponse) => {
                const err = error.error;
                this.notificationService.push('error', 'Data Set deletion failed', err['title']);
                this.bsModalRef.hide();
            });
    }
}

@Component({
    selector: 'jhi-data-set-delete-popup',
    template: ''
})
export class DataSetDeletePopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private dataSetPopupService: DataSetPopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            this.dataSetPopupService
                .open(DataSetDeleteDialogComponent as Component, params['id']);
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
