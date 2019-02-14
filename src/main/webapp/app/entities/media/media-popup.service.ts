import { Injectable, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { Media, MediaCategory } from './media.model';
import { MediaService } from './media.service';

@Injectable({ providedIn: 'root' })
export class MediaPopupService {
    private ngbModalRef: BsModalRef;

    constructor(
        private modalService: BsModalService,
        private router: Router,
        private mediaService: MediaService

    ) {
        this.ngbModalRef = null;
    }

    open(component: Component, id?: number | any): Promise<BsModalRef> {
        return new Promise<BsModalRef>((resolve, reject) => {
            const isOpen = this.ngbModalRef !== null;
            if (isOpen) {
                resolve(this.ngbModalRef);
            }

            if (id) {
                this.mediaService.find(id).subscribe((media: Media) => {
                    this.ngbModalRef = this.mediaModalRef(component, media);
                    resolve(this.ngbModalRef);
                });
            } else {
                // setTimeout used as a workaround for getting ExpressionChangedAfterItHasBeenCheckedError
                setTimeout(() => {
                    const media = new Media();
                    media['category'] = MediaCategory.MISCELLANEOUS;
                    this.ngbModalRef = this.mediaModalRef(component, media);
                    resolve(this.ngbModalRef);
                }, 0);
            }
        });
    }

    mediaModalRef(component: Component, media: Media): BsModalRef {
        const modalRef = this.modalService.show(component);
        modalRef.content.media = media;
        this.modalService.onHide.subscribe((result) => {
            this.router.navigate([{ outlets: { popup: null } }], { replaceUrl: true });
            this.ngbModalRef = null;
        }, (reason) => {
            this.router.navigate([{ outlets: { popup: null } }], { replaceUrl: true });
            this.ngbModalRef = null;
        });
        return modalRef;
    }
}
