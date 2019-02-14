import { Injectable, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { DataSource } from './data-source.model';
import { DataSourceService } from './data-source.service';

@Injectable({ providedIn: 'root' })
export class DataSourcePopupService {

    private ngbModalRef: BsModalRef;

    constructor(
        private modalService: BsModalService,
        private router: Router,
        private dataSourceService: DataSourceService

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
                this.dataSourceService.find(id).subscribe((dataSource: DataSource) => {
                    this.ngbModalRef = this.dataSourceModalRef(component, dataSource);
                    resolve(this.ngbModalRef);
                });
            } else {
                // setTimeout used as a workaround for getting ExpressionChangedAfterItHasBeenCheckedError
                setTimeout(() => {
                    this.ngbModalRef = this.dataSourceModalRef(component, new DataSource());
                    resolve(this.ngbModalRef);
                }, 0);
            }
        });
    }

    dataSourceModalRef(component: Component, dataSource: DataSource): BsModalRef {
        const modalRef = this.modalService.show(component);
        modalRef.content.dataSource = dataSource;
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
