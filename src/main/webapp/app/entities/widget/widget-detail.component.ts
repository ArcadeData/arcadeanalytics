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
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Subject, Observable } from 'rxjs/Rx';
import { JhiEventManager } from 'ng-jhipster';
import { NotificationService, CanComponentDeactivate } from '../../shared/';

import { Widget } from './widget.model';
import { WidgetService } from './widget.service';
import { WidgetImplementationComponent } from './implementation/widgetimplementation.component';
import { Principal } from '../../shared/auth/principal.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { HttpResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-widget-detail',
    templateUrl: './widget-detail.component.html'
})
export class WidgetDetailComponent implements OnInit, OnDestroy, CanComponentDeactivate {

    widget: Widget;
    widgetLoaded: boolean = false;

    private subscription: Subscription;
    private eventSubscriber: Subscription;
    private savePopupChoiceSubscriber: Subscription;

    @ViewChild('widgetImplementation') widgetImplementation: WidgetImplementationComponent;
    modalRef: BsModalRef;

    constructor(private eventManager: JhiEventManager,
        private modalService: BsModalService,
        private widgetService: WidgetService,
        private principal: Principal,
        private route: ActivatedRoute) {
    }

    ngOnInit() {
        this.subscription = this.route.params.subscribe((params) => {
            this.load(params['id']);
        });
        this.registerChangeInWidgets();
        this.registerSavePopupChoice();
    }

    load(id) {
        this.widgetService.find(id).subscribe((widget: Widget) => {
            this.widget = widget;
            this.widgetLoaded = true;
        });
    }

    previousState() {
        window.history.back();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.eventManager.destroy(this.eventSubscriber);
        this.eventManager.destroy(this.savePopupChoiceSubscriber);
    }

    registerChangeInWidgets() {
        this.eventSubscriber = this.eventManager.subscribe(
            'widgetListModification',
            (response) => this.load(this.widget.id)
        );
    }

    registerSavePopupChoice() {
        this.savePopupChoiceSubscriber = this.eventManager.subscribe(
            'savePopupChoice',
            (response) => {
                if (response['choice']) {
                    this.saveWidget();
                }
            }
        );
    }

    /**
     * Deactivate function
     */
    canDeactivate(): Observable<boolean> {
        console.log('Leaving the widget.');

        const subject = new Subject<boolean>();
        const saveAllowed: boolean = this.principal.hasAnyAuthorityDirect(['ROLE_ADMIN', 'ROLE_EDITOR']);
        if (saveAllowed) {
            if (this.widgetImplementation.toSave) {
                this.modalRef = this.modalService.show(SaveOnExitPopupComponent);
                this.modalRef.content.subject = subject;
                return subject.asObservable();
            } else {
                return Observable.of(true);
            }
        } else {
            return Observable.of(true);
        }
    }

    saveWidget() {
        this.widgetImplementation.saveAll();
    }

    /*
     * Methods to implement
     */

    widgetActivate(widgetId: number, widgetWidth: number) {
    }

    widgetClone(widgetId: number) {
    }

    widgetMove(widgetId: number) {
    }

    widgetRemove(widgetId: number) {
    }
}

@Component({
    selector: 'modal-content',
    template: `
        <div class="modal-header">
            <h4 class="modal-title pull-left">Save</h4>
            <button type="button" class="close pull-right" aria-label="Close" (click)="modalRef.hide()">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body text-center">
            <p>{{message}}</p><br/><br/>
            <button type="button" class="btn btn-default" (click)="action(true)">Yes</button> &nbsp;
            <button type="button" class="btn btn-primary" (click)="action(false)">No</button>
        </div>
  `
})

export class SaveOnExitPopupComponent implements OnInit, OnDestroy {

    title: string;
    message = 'There are some unstaged changes, do you want to save before exiting?';
    subject: Subject<boolean>;
    choiceTaken: boolean = false;

    constructor(private eventManager: JhiEventManager,
        public modalRef: BsModalRef) {
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        if (!this.choiceTaken) {
            // emit anyway a response for the widget-detail component, as it could be waiting for a subject next value
            this.subject.next(false);
            this.subject.complete();
        }
    }

    action(save: boolean) {     // we save the widget according to the boolean 'save' value

        // emit the event with the user choice
        if (save) {
            this.eventManager.broadcast({ name: 'savePopupChoice', choice: true });
        } else {
            this.eventManager.broadcast({ name: 'savePopupChoice', choice: false });
        }

        this.modalRef.hide();
        this.subject.next(true);    // we set always true as we have to leave the widget (canDeactivate call need true)
        this.subject.complete();
        this.choiceTaken = true;
    }
}
