import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { Principal } from '../../shared';
import { Observable } from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager, JhiAlertService, JhiDataUtils } from 'ng-jhipster';

import { Media, MediaCategory } from './media.model';
import { MediaPopupService } from './media-popup.service';
import { MediaService } from './media.service';
import { NotificationService } from '../../shared';
import { FileUploader } from 'ng2-file-upload';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-media-dialog',
    templateUrl: 'media-upload-dialog.component.html',
    styleUrls: ['media-upload-dialog.component.scss']
})
export class MediaUploadDialogComponent implements OnInit, OnDestroy {

    media: Media;
    chosenCategory: string;
    currentAccount: any;
    isSaving: boolean;
    filePreviewUrl: SafeUrl;

    // File Uploader
    uploaderOptions: Object = {
        url: ''
    };
    public uploader: FileUploader = new FileUploader(this.uploaderOptions);
    public hasBaseDropZoneOver: boolean = false;
    public fileAdded = false;
    sizeLimit = 1000000;    // size limit: 1MB

    // notifications
    messageTitle = 'Upload File';

    constructor(
        public bsModalRef: BsModalRef,
        private dataUtils: JhiDataUtils,
        private jhiAlertService: JhiAlertService,
        private mediaService: MediaService,
        private notificationService: NotificationService,
        private eventManager: JhiEventManager,
        private principal: Principal,
        private cdr: ChangeDetectorRef,
        private sanitizer: DomSanitizer
    ) {
        this.principal.identity().then((account) => {
            this.currentAccount = account;
        });
        this.chosenCategory = 'MISCELLANEOUS';
    }

    ngOnInit() {
        this.isSaving = false;
    }

    ngOnDestroy() {
        this.cdr.detach();
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

    fileOverBase(e: any): void {
        this.hasBaseDropZoneOver = e;
    }

    onFileDrop(event: any): void {
        if (!this.fileAdded) {
            const file: File = event[0];

            // type check
            if (file['type'].startsWith('image/')) {

                // size check
                if (file['size'] <= this.sizeLimit) {
                    this.fileAdded = true;
                    this.previewFile(file);
                    this.media['name'] = file.name;
                } else {
                    // WARNING NOTIFICATION
                    const message = 'You can\'t load this file as it exceeds the limit size (1MB).';
                    this.notificationService.push('warning', this.messageTitle, message);

                    this.uploader['queue'][0].remove();
                }
            } else {
                // WARNING NOTIFICATION
                const message = 'You can\'t load this file as its type is not supported.\nOnly image files are allowed.';
                this.notificationService.push('warning', this.messageTitle, message);

                this.uploader['queue'][0].remove();
            }
        } else {
            this.uploader['queue'][1].remove();
        }
    }

    onFileSelect(event: any): void {
        const input: HTMLInputElement = <HTMLInputElement>event.target;
        if (input.files && input.files[0]) {
            const file: File = input.files[0];

            // size check
            if (file['size'] <= this.sizeLimit) {
                this.fileAdded = true;
                this.previewFile(file);
                this.media['name'] = file.name;
            } else {
                // WARNING NOTIFICATION
                const message = 'You can\'t load this file as it exceeds the limit size (1MB).';
                this.notificationService.push('warning', this.messageTitle, message);

                this.uploader['queue'][0].remove();
            }
        }
    }

    previewFile(file: File) {

        // update preview for the selected file
        const reader = new FileReader();
        reader.onload = (event: any) => {
            this.filePreviewUrl = this.sanitizer.bypassSecurityTrustUrl((<string>reader.result));
            this.updateMediaData(this.filePreviewUrl['changingThisBreaksApplicationSecurity']);
        };
        reader.readAsDataURL(file);
    }

    removeFile() {

        // removing file from the uploader
        this.uploader.queue[0].remove();

        // cleaning media file e fileContentType
        this.media['file'] = undefined;
        this.media['fileContentType'] = undefined;
        this.media['name'] = undefined;

        // setting fileAdded to false (css change through ngClass)
        this.fileAdded = false;
    }

    updateMediaData(dataUrl) {
        dataUrl = dataUrl.replace('data:', '');
        const split = dataUrl.split(';base64,');
        this.media['fileContentType'] = split[0];
        this.media['file'] = split[1];
    }

    updateMediaCategory() {
        // assigning category
        switch (this.chosenCategory) {
            case 'BROWSERS': this.media['category'] = MediaCategory.BROWSERS;
                break;
            case 'BUILDINGS': this.media['category'] = MediaCategory.BUILDINGS;
                break;
            case 'BUSINESS': this.media['category'] = MediaCategory.BUSINESS;
                break;
            case 'CHARACTERS': this.media['category'] = MediaCategory.CHARACTERS;
                break;
            case 'COMMUNICATION': this.media['category'] = MediaCategory.COMMUNICATION;
                break;
            case 'ENTERTAINMENT': this.media['category'] = MediaCategory.ENTERTAINMENT;
                break;
            case 'GEO': this.media['category'] = MediaCategory.GEO;
                break;
            case 'ICONS': this.media['category'] = MediaCategory.ICONS;
                break;
            case 'PEOPLE': this.media['category'] = MediaCategory.PEOPLE;
                break;
            case 'PICTURES': this.media['category'] = MediaCategory.PICTURES;
                break;
            case 'SCIENCE': this.media['category'] = MediaCategory.SCIENCE;
                break;
            case 'TECHNOLOGY': this.media['category'] = MediaCategory.TECHNOLOGY;
                break;
            case 'VEHICLES': this.media['category'] = MediaCategory.VEHICLES;
                break;
            case 'MISCELLANEOUS': this.media['category'] = MediaCategory.MISCELLANEOUS;
                break;
            default: this.media['category'] = MediaCategory.MISCELLANEOUS;
                break;
        }
    }

    clear() {
        this.bsModalRef.hide();
    }

    save() {
        this.isSaving = true;
        if (this.media.id !== undefined) {
            this.subscribeToSaveResponse(
                this.mediaService.update(this.media));
        } else {
            this.subscribeToSaveResponse(
                this.mediaService.create(this.media));
        }
    }

    private subscribeToSaveResponse(result: Observable<Media>) {
        result.subscribe((res: Media) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: Media) {
        this.bsModalRef.hide();
        this.isSaving = false;
        const message = 'A new Media is created with identifier ' + result['id'];
        this.notificationService.push('success', this.messageTitle, message);
        setTimeout(() => {
            this.eventManager.broadcast({ name: 'mediaListModification', content: { status: 'OK', media: result } });
        }, 100);
    }

    private onSaveError(res: any) {
        const message = 'Error during the creation of a new Media.\n' + res['_body'];
        this.notificationService.push('error', this.messageTitle, message);
        this.isSaving = false;
    }

    private onError(error: any) {
        this.jhiAlertService.error(error.message, null, null);
    }
}

@Component({
    selector: 'jhi-media-popup',
    template: ''
})
export class MediaUploadPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private mediaPopupService: MediaPopupService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if (params['id']) {
                this.mediaPopupService
                    .open(MediaUploadDialogComponent as Component, params['id']);
            } else {
                this.mediaPopupService
                    .open(MediaUploadDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
