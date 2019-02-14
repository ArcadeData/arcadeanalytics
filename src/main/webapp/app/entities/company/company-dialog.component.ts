import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { Company } from './company.model';
import { CompanyPopupService } from './company-popup.service';
import { CompanyService } from './company.service';
import { Contract, ContractService } from '../contract';
import { ResponseWrapper } from '../../shared';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-company-dialog',
    templateUrl: './company-dialog.component.html'
})
export class CompanyDialogComponent implements OnInit {

    company: Company;
    isSaving: boolean;

    contracts: Contract[];

    constructor(
        public bsModalRef: BsModalRef,
        private companyService: CompanyService,
        private contractService: ContractService,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    ngOnInit() {
        this.isSaving = false;
        this.contractService.query()
            .subscribe((res: HttpResponse<Company[]>) => { this.contracts = res.body; }, (res: ResponseWrapper) => this.onError(res.json));
    }

    clear() {
        this.bsModalRef.hide();
    }

    save() {
        this.isSaving = true;
        if (this.company.id !== undefined) {
            this.subscribeToSaveResponse(
                this.companyService.update(this.company));
        } else {
            this.subscribeToSaveResponse(
                this.companyService.create(this.company));
        }
    }

    private subscribeToSaveResponse(result: Observable<Company>) {
        result.subscribe((res: Company) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: Company) {
        this.eventManager.broadcast({ name: 'companyListModification', content: 'OK'});
        this.isSaving = false;
        this.bsModalRef.hide();
    }

    private onSaveError(error: any) {
        this.isSaving = false;
        this.notificationService.push('error', 'Company creation failed', error.title);
    }

    private onError(error: any) {
        this.notificationService.push('error', 'Company init error', error.title);
    }

    trackContractById(index: number, item: Contract) {
        return item.id;
    }
}

@Component({
    selector: 'jhi-company-popup',
    template: ''
})
export class CompanyPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private companyPopupService: CompanyPopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if ( params['id'] ) {
                this.companyPopupService
                    .open(CompanyDialogComponent as Component, params['id']);
            } else {
                this.companyPopupService
                    .open(CompanyDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
