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
import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { JhiEventManager, JhiAlertService } from 'ng-jhipster';
import { Subscription } from 'rxjs/Rx';

@Component({
    selector: 'jhi-alert-error',
    template: `
        <div class="alerts" role="alert">
            <div *ngFor="let alert of alerts"  [ngClass]="{\'alert.position\': true, \'toast\': alert.toast}">
                <div *ngIf="alert && alert.type && alert.msg" [ngClass]="['alert', alert.type]" (close)="alert.close(alerts)">
                    <pre [innerHTML]="alert.msg"></pre>
                </div>
            </div>
        </div>`
})
export class JhiAlertErrorComponent implements OnDestroy {

    alerts: any[];
    cleanHttpErrorListener: Subscription;
    // tslint:disable-next-line: no-unused-variable
    constructor(private alertService: JhiAlertService, private eventManager: JhiEventManager, private translateService: TranslateService) {
        this.alerts = [];

        this.cleanHttpErrorListener = eventManager.subscribe('arcadeanalyticsApp.httpError', (response) => {
            let i;
            const httpResponse = response.content;
            switch (httpResponse.status) {
                // connection refused, server not reachable
                case 0:
                    this.addErrorAlert('Server not reachable', 'error.server.not.reachable');
                    break;

                case 400:
                    const arr = Array.from(httpResponse.headers._headers);
                    const headers = [];
                    for (i = 0; i < arr.length; i++) {
                        if (arr[i][0].endsWith('app-error') || arr[i][0].endsWith('app-params')) {
                            headers.push(arr[i][0]);
                        }
                    }
                    headers.sort();
                    let errorHeader = null;
                    let entityKey = null;
                    if (headers.length > 1) {
                        errorHeader = httpResponse.headers.get(headers[0]);
                        entityKey = httpResponse.headers.get(headers[1]);
                    }
                    if (errorHeader) {
                        const entityName = translateService.instant('global.menu.entities.' + entityKey);
                        this.addErrorAlert(errorHeader, errorHeader, { entityName });
                    } else if (httpResponse.error !== '' && httpResponse.error && httpResponse.error.fieldErrors) {
                        const fieldErrors = httpResponse.error.fieldErrors;
                        for (i = 0; i < fieldErrors.length; i++) {
                            const fieldError = fieldErrors[i];
                            // convert 'something[14].other[4].id' to 'something[].other[].id' so translations can be written to it
                            const convertedField = fieldError.field.replace(/\[\d*\]/g, '[]');
                            const fieldName = translateService.instant('arcadeanalyticsApp.' +
                                fieldError.objectName + '.' + convertedField);
                            this.addErrorAlert(
                                'Error on field "' + fieldName + '"', 'error.' + fieldError.message, { fieldName });
                        }
                    } else if (httpResponse.error !== '' && httpResponse.error && httpResponse.error.message) {
                        this.addErrorAlert(httpResponse.error.message, httpResponse.error.message, httpResponse.error.params);
                    } else {
                        this.addErrorAlert(httpResponse.error);
                    }
                    break;

                case 404:
                    this.addErrorAlert('Not found', 'error.url.not.found');
                    break;

                default:
                    if (httpResponse.error !== '' && httpResponse.error && httpResponse.error.message) {
                        this.addErrorAlert(httpResponse.error.message);
                    } else {
                        this.addErrorAlert(httpResponse.error);
                    }
            }
        });
    }

    ngOnDestroy() {
        if (this.cleanHttpErrorListener !== undefined && this.cleanHttpErrorListener !== null) {
            this.eventManager.destroy(this.cleanHttpErrorListener);
            this.alerts = [];
        }
    }

    addErrorAlert(message, key?, data?) {
        key = (key && key !== null) ? key : message;
        this.alerts.push(
            this.alertService.addAlert(
                {
                    type: 'danger',
                    msg: key,
                    params: data,
                    timeout: 5000,
                    toast: this.alertService.isToast(),
                    scoped: true
                },
                this.alerts
            )
        );
    }
}
