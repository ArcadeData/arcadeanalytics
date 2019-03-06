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
import { Injectable, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { Company } from './company.model';
import { CompanyService } from './company.service';

@Injectable({ providedIn: 'root' })
export class CompanyPopupService {

    private ngbModalRef: BsModalRef;

    constructor(
        private modalService: BsModalService,
        private router: Router,
        private companyService: CompanyService

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
                this.companyService.find(id).subscribe((company: Company) => {
                    this.ngbModalRef = this.companyModalRef(component, company);
                    resolve(this.ngbModalRef);
                });
            } else {
                // setTimeout used as a workaround for getting ExpressionChangedAfterItHasBeenCheckedError
                setTimeout(() => {
                    this.ngbModalRef = this.companyModalRef(component, new Company());
                    resolve(this.ngbModalRef);
                }, 0);
            }
        });
    }

    companyModalRef(component: Component, company: Company): BsModalRef {
        const modalRef = this.modalService.show(component);
        modalRef.content.company = company;
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
