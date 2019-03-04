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

import { Observable } from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { Contract } from './contract.model';
import { ContractPopupService } from './contract-popup.service';
import { ContractService } from './contract.service';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-contract-dialog',
    templateUrl: './contract-dialog.component.html'
})
export class ContractDialogComponent implements OnInit {

    contract: Contract;
    isSaving: boolean;

    constructor(
        public bsModalRef: BsModalRef,
        private contractService: ContractService,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    ngOnInit() {
        this.isSaving = false;
    }

    clear() {
        this.bsModalRef.hide();
    }

    save() {
        this.isSaving = true;
        if (this.contract.id !== undefined) {
            this.subscribeToSaveResponse(
                this.contractService.update(this.contract));
        } else {
            this.subscribeToSaveResponse(
                this.contractService.create(this.contract));
        }
    }

    private subscribeToSaveResponse(result: Observable<Contract>) {
        result.subscribe((res: Contract) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: Contract) {
        this.eventManager.broadcast({ name: 'contractListModification', content: 'OK'});
        this.isSaving = false;
        this.bsModalRef.hide();
    }

    private onSaveError(error: any) {
        this.isSaving = false;
        this.notificationService.push('error', 'Contract creation failed', error.title);
    }

    private onError(error: any) {
        this.notificationService.push('error', 'Contract init error', error.title);
    }
}

@Component({
    selector: 'jhi-contract-popup',
    template: ''
})
export class ContractPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private contractPopupService: ContractPopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if ( params['id'] ) {
                this.contractPopupService
                    .open(ContractDialogComponent as Component, params['id']);
            } else {
                this.contractPopupService
                    .open(ContractDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
