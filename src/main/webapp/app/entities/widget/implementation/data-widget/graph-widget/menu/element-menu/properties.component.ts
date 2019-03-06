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
import { Component, OnInit, OnDestroy, OnChanges, Input, SimpleChanges, AfterViewChecked } from '@angular/core';

@Component({
    selector: 'element-properties',
    templateUrl: 'properties.component.html',
    styleUrls: ['properties.component.scss']
})
export class PropertiesComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {

    @Input() element: Element;
    @Input() styleClass: Object;

    public properties: string[];

    constructor() {
    }

    ngOnInit() { }

    initComponentInfo() {
        this.properties = [];
        for (const prop in (<any>this.element).record) {
            if (!prop.startsWith('@')) {
                this.properties.push(prop);
            }
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.element) {     // we don't need to re-init if the new selected element belongs to the same class
            this.initComponentInfo();
        } else {
            console.log('Error: just element or style class changed during new element selection.');
        }
    }

    ngAfterViewChecked() {
        // (<any>$('.popover')).css('margin-left', '30px');
    }

    ngOnDestroy() { }

}
