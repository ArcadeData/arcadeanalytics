import { Injectable, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';

import { User, UserService } from '../../shared';
import { HttpResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserModalService {
    private ngbModalRef: BsModalRef;

    constructor(
        private modalService: BsModalService,
        private router: Router,
        private userService: UserService
    ) {
        this.ngbModalRef = null;
    }

    open(component: Component, login?: string): Promise<BsModalRef> {
        return new Promise<BsModalRef>((resolve, reject) => {
            const isOpen = this.ngbModalRef !== null;
            if (isOpen) {
                resolve(this.ngbModalRef);
        }

        if (login) {
                this.userService.find(login).subscribe((user: HttpResponse<User>) => {
                    this.ngbModalRef = this.userModalRef(component, user.body);
                    resolve(this.ngbModalRef);
                });
        } else {
                // setTimeout used as a workaround for getting ExpressionChangedAfterItHasBeenCheckedError
                setTimeout(() => {
                    this.ngbModalRef = this.userModalRef(component, new User());
                    resolve(this.ngbModalRef);
                }, 0);
        }
        });
    }

    userModalRef(component: Component, user: User): BsModalRef {
        const modalRef = this.modalService.show(component);
        modalRef.content.user = user;
        this.modalService.onHide.subscribe((result) => {
            this.router.navigate([{ outlets: { popup: null }}], { replaceUrl: true });
            this.ngbModalRef = null;
        }, (reason) => {
            this.router.navigate([{ outlets: { popup: null }}], { replaceUrl: true });
            this.ngbModalRef = null;
        });

        // modalRef.result.then((result) => {
        //     this.router.navigate([{ outlets: { popup: null }}], { replaceUrl: true });
        //     this.isOpen = false;
        // }, (reason) => {
        //     this.router.navigate([{ outlets: { popup: null }}], { replaceUrl: true });
        //     this.isOpen = false;
        // });

        return modalRef;
    }
}
