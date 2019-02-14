import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';

import { Contract } from './contract.model';
import { ContractService } from './contract.service';
import { HttpResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-contract-detail',
    templateUrl: './contract-detail.component.html'
})
export class ContractDetailComponent implements OnInit, OnDestroy {

    contract: Contract;
    private subscription: Subscription;
    private eventSubscriber: Subscription;

    constructor(
        private eventManager: JhiEventManager,
        private contractService: ContractService,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        this.subscription = this.route.params.subscribe((params) => {
            this.load(params['id']);
        });
        this.registerChangeInContracts();
    }

    load(id) {
        this.contractService.find(id).subscribe((contract: Contract) => {
            this.contract = contract;
        });
    }
    previousState() {
        window.history.back();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.eventManager.destroy(this.eventSubscriber);
    }

    registerChangeInContracts() {
        this.eventSubscriber = this.eventManager.subscribe(
            'contractListModification',
            (response) => this.load(this.contract.id)
        );
    }
}
