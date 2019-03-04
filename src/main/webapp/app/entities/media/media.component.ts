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
import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager, JhiParseLinks, JhiAlertService, JhiDataUtils } from 'ng-jhipster';
import { DomSanitizer } from '@angular/platform-browser';

import { Media } from './media.model';
import { MediaService } from './media.service';
import { ITEMS_PER_PAGE, Principal, ResponseWrapper } from '../../shared';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-media',
    templateUrl: './media.component.html',
    styleUrls: ['./media.component.scss']
})
export class MediaComponent implements OnInit, OnDestroy {

    currentAccount: any;
    media: Media[];
    error: any;
    success: any;
    eventSubscriber: Subscription;
    currentSearch: string;
    routeData: any;
    links: any;
    totalItems: any;
    queryCount: any;
    itemsPerPage: any;
    page: any;
    predicate: any;
    previousPage: any;
    reverse: any;

    modalRef: BsModalRef;
    currentMediaForPreview;

    constructor(
        private mediaService: MediaService,
        private parseLinks: JhiParseLinks,
        private jhiAlertService: JhiAlertService,
        private principal: Principal,
        private activatedRoute: ActivatedRoute,
        private dataUtils: JhiDataUtils,
        private router: Router,
        private eventManager: JhiEventManager,
        private sanitizer: DomSanitizer,
        private modalService: BsModalService
    ) {
        this.itemsPerPage = ITEMS_PER_PAGE;
        this.routeData = this.activatedRoute.data.subscribe((data) => {
            this.page = data['pagingParams'].page;
            this.previousPage = data['pagingParams'].page;
            this.reverse = data['pagingParams'].ascending;
            this.predicate = data['pagingParams'].predicate;
        });
        this.currentSearch = activatedRoute.snapshot.params['search'] ? activatedRoute.snapshot.params['search'] : '';
    }

    /**
     * Loads all the elements for the last selected page (this.page)
     */
    loadAll() {
        if (this.currentSearch) {
            this.mediaService.search({
                page: this.page - 1,
                query: this.currentSearch,
                size: this.itemsPerPage,
                sort: this.sort()
            }).subscribe(
                (res: HttpResponse<Media[]>) => this.onSuccess(res.body, res.headers),
                (res: HttpErrorResponse) => this.onError(res.error)
            );
            return;
        }
        this.mediaService.query({
            page: this.page - 1,
            size: this.itemsPerPage,
            sort: this.sort()
        }).subscribe(
            (res: HttpResponse<Media[]>) => this.onSuccess(res.body, res.headers),
            (res: HttpErrorResponse) => this.onError(res.error)
        );
    }

    loadPage(event: any, forceLoading?: boolean) {

        // if loadPage(..) called from an event update the page value according to that event, otherwise use the last value
        if (event && event.page) {
            this.page = event.page;
        }
        if (forceLoading) {
            this.transition();
            this.previousPage = this.page;
        } else if (this.page !== this.previousPage) {
            this.transition();
            this.previousPage = this.page;
        }
    }

    transition() {
        this.router.navigate(['/media'], {
            queryParams: {
                page: this.page,
                size: this.itemsPerPage,
                search: this.currentSearch,
                sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
            }
        });
        this.loadAll();
    }

    clear() {
        this.page = 0;
        this.currentSearch = '';
        this.router.navigate(['/media', {
            page: this.page,
            sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
        }]);
        this.loadAll();
    }

    search(query) {
        if (!query) {
            return this.clear();
        }
        this.page = 0;
        this.currentSearch = query;
        this.router.navigate(['/media', {
            search: this.currentSearch,
            page: this.page,
            sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
        }]);
        this.loadAll();
    }

    handleSearchOnKeydown(event) {
        if (event.keyCode === 13) {
            this.search(this.currentSearch);
        } else if (event.keyCode === 46 || event.keyCode === 8) {
            setTimeout(() => {
                if (this.currentSearch === '') {
                    this.clear();
                }
            }, 10);
        }
    }

    ngOnInit() {
        this.loadPage(undefined, true);
        this.principal.identity().then((account) => {
            this.currentAccount = account;
        });
        this.registerChangeInMedia();
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    trackId(index: number, item: Media) {
        return item.id;
    }

    byteSize(field) {
        return this.dataUtils.byteSize(field);
    }

    openFile(contentType, field) {
        return this.dataUtils.openFile(contentType, field);
    }

    registerChangeInMedia() {
        this.eventSubscriber = this.eventManager.subscribe('mediaListModification', (response) => this.loadAll());
    }

    sort() {
        const result = [this.predicate + ',' + (this.reverse ? 'asc' : 'desc')];
        if (this.predicate !== 'id') {
            result.push('id');
        }
        return result;
    }

    private onSuccess(data, headers) {
        this.links = this.parseLinks.parse(headers.get('link'));
        this.totalItems = headers.get('X-Total-Count');
        this.queryCount = this.totalItems;
        // this.page = pagingParams.page;

        // updating data urls
        for (const media of data) {
            this.updateDataUrl(media);
        }

        this.media = data;
    }
    private onError(error) {
        this.jhiAlertService.error(error.message, null, null);
    }

    updateDataUrl(media: Media) {
        const url = 'data:' + media['fileContentType'].replace(' ', '') + ';base64,' + media['file'];
        media['file'] = this.sanitizer.bypassSecurityTrustUrl(url);
    }

    openModal(template: TemplateRef<any>, media) {
        this.currentMediaForPreview = media;
        this.modalRef = this.modalService.show(template);
    }

    closePreviewModal() {
        this.modalRef.hide();
        this.currentMediaForPreview = undefined;
    }
}
