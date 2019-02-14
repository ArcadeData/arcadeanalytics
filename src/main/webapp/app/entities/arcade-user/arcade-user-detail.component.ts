import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';

import { ArcadeUser } from './arcade-user.model';
import { ArcadeUserService } from './arcade-user.service';
import { HttpResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-arcade-user-detail',
    templateUrl: './arcade-user-detail.component.html'
})
export class ArcadeUserDetailComponent implements OnInit, OnDestroy {

    arcadeUser: ArcadeUser;
    private subscription: Subscription;
    private eventSubscriber: Subscription;

    constructor(
        private eventManager: JhiEventManager,
        private arcadeUserService: ArcadeUserService,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        this.subscription = this.route.params.subscribe((params) => {
            this.load(params['id']);
        });
        this.registerChangeInArcadeUsers();
    }

    load(id) {
        this.arcadeUserService.find(id).subscribe((arcadeUser: ArcadeUser) => {
            this.arcadeUser = arcadeUser;
        });
    }
    previousState() {
        window.history.back();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.eventManager.destroy(this.eventSubscriber);
    }

    registerChangeInArcadeUsers() {
        this.eventSubscriber = this.eventManager.subscribe(
            'arcadeUserListModification',
            (response) => this.load(this.arcadeUser.id)
        );
    }
}
