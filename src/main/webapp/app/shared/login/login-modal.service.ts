import { Injectable } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { JhiLoginModalComponent } from './login.component';

@Injectable({ providedIn: 'root' })
export class LoginModalService {

    // private isOpen = false;
    private bsModalRef: BsModalRef;

    constructor(private modalService: BsModalService) {}

    public open(): BsModalRef {
        // if (this.isOpen) {
        //     return;
        // }
        // this.isOpen = true;
        this.bsModalRef = this.modalService.show(JhiLoginModalComponent);
        return this.bsModalRef;
    }
}
