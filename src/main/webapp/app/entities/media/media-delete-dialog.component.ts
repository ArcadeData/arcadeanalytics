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

import { Media } from './media.model';
import { MediaPopupService } from './media-popup.service';
import { MediaService } from './media.service';
import {NotificationService} from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-media-delete-dialog',
    templateUrl: './media-delete-dialog.component.html'
})
export class MediaDeleteDialogComponent {

    media: Media;

    constructor(
        private mediaService: MediaService,
        public bsModalRef: BsModalRef,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {
    }

    clear() {
        this.bsModalRef.hide();
    }

    confirmDelete(id: number) {
        this.mediaService.delete(id).subscribe((response: HttpResponse<any>) => {
                this.eventManager.broadcast({
                    name: 'mediaListModification',
                    content: {
                        status: 'Deleted a media'
                    }
                });
                this.bsModalRef.hide();
            },
            (error: HttpErrorResponse) => {
                const err = error.error;
                this.notificationService.push('error', 'Media deletion failed', err['title']);
                this.bsModalRef.hide();
            });
    }
}

@Component({
    selector: 'jhi-media-delete-popup',
    template: ''
})
export class MediaDeletePopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private mediaPopupService: MediaPopupService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            this.mediaPopupService
                .open(MediaDeleteDialogComponent as Component, params['id']);
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
