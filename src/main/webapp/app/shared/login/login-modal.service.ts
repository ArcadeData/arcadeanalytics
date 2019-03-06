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
