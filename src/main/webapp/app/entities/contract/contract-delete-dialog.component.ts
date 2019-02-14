import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { Contract } from './contract.model';
import { ContractPopupService } from './contract-popup.service';
import { ContractService } from './contract.service';
import {NotificationService} from '../../shared/services/notification.service';

@Component({
    selector: 'jhi-contract-delete-dialog',
    templateUrl: './contract-delete-dialog.component.html'
})
export class ContractDeleteDialogComponent {

    contract: Contract;

    constructor(
        private contractService: ContractService,
        public bsModalRef: BsModalRef,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    clear() {
        this.bsModalRef.hide();
    }

    confirmDelete(id: number) {
        this.contractService.delete(id).subscribe((response) => {
                this.eventManager.broadcast({
                    name: 'contractListModification',
                    content: 'Deleted a contract'
                });
                this.bsModalRef.hide();
            },
            (error) => {
                const err = error.error;
                this.notificationService.push('error', 'Contract deletion failed', err['title']);
                this.bsModalRef.hide();
            });
    }
}

@Component({
    selector: 'jhi-contract-delete-popup',
    template: ''
})
export class ContractDeletePopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private contractPopupService: ContractPopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            this.contractPopupService
                .open(ContractDeleteDialogComponent as Component, params['id']);
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
