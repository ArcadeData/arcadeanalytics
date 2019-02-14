import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager} from 'ng-jhipster';

import { ArcadeUser } from './arcade-user.model';
import { ArcadeUserPopupService } from './arcade-user-popup.service';
import { ArcadeUserService } from './arcade-user.service';
import { User, UserService } from '../../shared';
import { Company, CompanyService } from '../company';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-arcade-user-dialog',
    templateUrl: './arcade-user-dialog.component.html'
})
export class ArcadeUserDialogComponent implements OnInit {

    arcadeUser: ArcadeUser;
    isSaving: boolean;

    users: User[];

    companies: Company[];

    constructor(
        public bsModalRef: BsModalRef,
        private arcadeUserService: ArcadeUserService,
        private userService: UserService,
        private companyService: CompanyService,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService

    ) {
    }

    ngOnInit() {
        this.isSaving = false;
        this.userService.query()
            .subscribe((res: HttpResponse<User[]>) => { this.users = res.body; }, (res: HttpErrorResponse) => this.onError(res.error));
        this.companyService.query()
            .subscribe((res: HttpResponse<Company[]>) => { this.companies = res.body; }, (res: HttpErrorResponse) => this.onError(res.error));
    }

    clear() {
        this.bsModalRef.hide();
    }

    save() {
        this.isSaving = true;
        if (this.arcadeUser.id !== undefined) {
            this.subscribeToSaveResponse(
                this.arcadeUserService.update(this.arcadeUser));
        } else {
            this.subscribeToSaveResponse(
                this.arcadeUserService.create(this.arcadeUser));
        }
    }

    private subscribeToSaveResponse(result: Observable<ArcadeUser>) {
        result.subscribe((res: ArcadeUser) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError());
    }

    private onSaveSuccess(result: ArcadeUser) {
        this.eventManager.broadcast({ name: 'arcadeUserListModification', content: 'OK'});
        this.isSaving = false;
        this.bsModalRef.hide();
    }

    private onSaveError() {
        this.isSaving = false;
    }

    private onError(error: any) {
        this.notificationService.push('error', 'User init error', error.title);
    }

    trackUserById(index: number, item: User) {
        return item.id;
    }

    trackCompanyById(index: number, item: Company) {
        return item.id;
    }
}

@Component({
    selector: 'jhi-arcade-user-popup',
    template: ''
})
export class ArcadeUserPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private arcadeUserPopupService: ArcadeUserPopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if ( params['id'] ) {
                this.arcadeUserPopupService
                    .open(ArcadeUserDialogComponent as Component, params['id']);
            } else {
                this.arcadeUserPopupService
                    .open(ArcadeUserDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
