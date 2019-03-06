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

import { Principal } from '../../shared';
import { Observable } from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager, JhiDataUtils } from 'ng-jhipster';

import { Media } from './media.model';
import { MediaPopupService } from './media-popup.service';
import { MediaService } from './media.service';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-media-dialog',
    templateUrl: 'media-edit-dialog.component.html'
})
export class MediaEditDialogComponent implements OnInit {

    media: Media;
    currentAccount: any;
    isSaving: boolean;

    constructor(
        public bsModalRef: BsModalRef,
        private dataUtils: JhiDataUtils,
        private mediaService: MediaService,
        private eventManager: JhiEventManager,
        private principal: Principal,
        private notificationService: NotificationService
    ) {
        this.principal.identity().then((account) => {
            this.currentAccount = account;
        });
    }

    ngOnInit() {
        this.isSaving = false;
    }

    byteSize(field) {
        return this.dataUtils.byteSize(field);
    }

    openFile(contentType, field) {
        return this.dataUtils.openFile(contentType, field);
    }

    setFileData(event, entity, field, isImage) {
        this.dataUtils.setFileData(event, entity, field, isImage);
    }

    clear() {
        this.bsModalRef.hide();
    }

    save() {
        this.isSaving = true;
        this.subscribeToSaveResponse(this.mediaService.update(this.media));
    }

    private subscribeToSaveResponse(result: Observable<Media>) {
        result.subscribe((res: Media) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: Media) {
        this.eventManager.broadcast({ name: 'mediaListModification', content: { status: 'OK', media: result } });
        this.isSaving = false;
        this.bsModalRef.hide();
    }

    private onSaveError(error: any) {
        this.isSaving = false;
        this.notificationService.push('error', 'Media editing failed', error.title);
    }

    private onError(error: any) {
        this.notificationService.push('error', 'Media init error', error.title);
    }
}

@Component({
    selector: 'jhi-media-popup',
    template: ''
})
export class MediaEditPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private mediaPopupService: MediaPopupService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if (params['id']) {
                this.mediaPopupService
                    .open(MediaEditDialogComponent as Component, params['id']);
            } else {
                this.mediaPopupService
                    .open(MediaEditDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
