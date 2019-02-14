import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { ArcadeUser } from './arcade-user.model';
import { ArcadeUserPopupService } from './arcade-user-popup.service';
import { ArcadeUserService } from './arcade-user.service';
import {NotificationService} from '../../shared/services/notification.service';

@Component({
    selector: 'jhi-arcade-user-delete-dialog',
    templateUrl: './arcade-user-delete-dialog.component.html'
})
export class ArcadeUserDeleteDialogComponent {

    arcadeUser: ArcadeUser;

    constructor(
        private arcadeUserService: ArcadeUserService,
        public bsModalRef: BsModalRef,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService

    ) {
    }

    clear() {
        this.bsModalRef.hide();
    }

    confirmDelete(id: number) {
        this.arcadeUserService.delete(id).subscribe((response) => {
            this.eventManager.broadcast({
                name: 'arcadeUserListModification',
                content: 'Deleted an arcadeUser'
            });
                this.bsModalRef.hide();
            },
            (error) => {
                const err = error.error;
                this.notificationService.push('error', 'User deletion failed', err['title']);
                this.bsModalRef.hide();
        });
    }
}

@Component({
    selector: 'jhi-arcade-user-delete-popup',
    template: ''
})
export class ArcadeUserDeletePopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private arcadeUserPopupService: ArcadeUserPopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            this.arcadeUserPopupService
                .open(ArcadeUserDeleteDialogComponent as Component, params['id']);
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
