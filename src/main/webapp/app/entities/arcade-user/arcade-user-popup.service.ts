import { Injectable, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { ArcadeUser } from './arcade-user.model';
import { ArcadeUserService } from './arcade-user.service';

@Injectable({ providedIn: 'root' })
export class ArcadeUserPopupService {
    private ngbModalRef: BsModalRef;

    constructor(
        private modalService: BsModalService,
        private router: Router,
        private arcadeUserService: ArcadeUserService

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
                this.arcadeUserService.find(id).subscribe((arcadeUser: ArcadeUser) => {
                    this.ngbModalRef = this.arcadeUserModalRef(component, arcadeUser);
                    resolve(this.ngbModalRef);
                });
            } else {
                // setTimeout used as a workaround for getting ExpressionChangedAfterItHasBeenCheckedError
                setTimeout(() => {
                    this.ngbModalRef = this.arcadeUserModalRef(component, new ArcadeUser());
                    resolve(this.ngbModalRef);
                }, 0);
            }
        });
    }

    arcadeUserModalRef(component: Component, arcadeUser: ArcadeUser): BsModalRef {
        const modalRef = this.modalService.show(component);
        modalRef.content.arcadeUser = arcadeUser;
        this.modalService.onHide.subscribe((result) => {
            this.router.navigate([{ outlets: { popup: null }}], { replaceUrl: true });
            this.ngbModalRef = null;
        }, (reason) => {
            this.router.navigate([{ outlets: { popup: null }}], { replaceUrl: true });
            this.ngbModalRef = null;
        });
        return modalRef;
    }
}
