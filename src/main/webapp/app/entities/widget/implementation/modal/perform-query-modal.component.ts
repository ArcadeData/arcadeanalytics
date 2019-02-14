import { Component, OnInit, OnDestroy } from '@angular/core';

import {Observable, Subject} from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
    selector: 'jhi-perform-query-popup',
    templateUrl: './perform-query-modal.component.html'
})
export class PerformQueryModalComponent implements OnInit, OnDestroy {

    public subject: Subject<boolean>;

    constructor(public modalRef: BsModalRef) {}

    ngOnInit() {}

    ngOnDestroy() {}

    action(choice: boolean) {     // we save the widget according to the boolean 'save' value
        this.modalRef.hide();
        this.subject.next(choice);    // we set always true as we have to leave the widget (canDeactivate call need true)
        this.subject.complete();
    }
}
