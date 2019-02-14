import { Injectable, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { Workspace } from './workspace.model';
import { WorkspaceService } from './workspace.service';
import { HttpResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class WorkspacePopupService {

    private ngbModalRef: BsModalRef;

    constructor(
        private modalService: BsModalService,
        private router: Router,
        private workspaceService: WorkspaceService

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
                this.workspaceService.find(id).subscribe((workspace: Workspace) => {
                    this.ngbModalRef = this.workspaceModalRef(component, workspace);
                    resolve(this.ngbModalRef);
                });
            } else {
                // setTimeout used as a workaround for getting ExpressionChangedAfterItHasBeenCheckedError
                setTimeout(() => {
                    this.ngbModalRef = this.workspaceModalRef(component, new Workspace());
                    resolve(this.ngbModalRef);
                }, 0);
            }
        });
    }

    workspaceModalRef(component: Component, workspace: Workspace): BsModalRef {
        const modalRef = this.modalService.show(component);
        modalRef.content.workspace = workspace;
        this.modalService.onHide.subscribe((result) => {
            this.router.navigate([{ outlets: { popup: null } }], { replaceUrl: true });
            this.ngbModalRef = null;
        }, (reason) => {
            this.router.navigate([{ outlets: { popup: null } }], { replaceUrl: true });
            this.ngbModalRef = null;
        });

        // modalRef.result.then((result) => {
        //     this.router.navigate([{ outlets: { popup: null }}], { replaceUrl: true });
        //     this.ngbModalRef = null;
        // }, (reason) => {
        //     this.router.navigate([{ outlets: { popup: null }}], { replaceUrl: true });
        //     this.ngbModalRef = null;
        // });

        return modalRef;
    }
}
