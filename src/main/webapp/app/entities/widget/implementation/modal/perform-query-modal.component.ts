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
