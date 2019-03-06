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
import {
    Component, OnInit, OnDestroy, AfterViewInit, OnChanges, Input, SimpleChanges,
    AfterViewChecked
} from '@angular/core';

import * as $ from 'jquery';

@Component({
    selector: 'element-label',
    templateUrl: 'label.component.html',
    styleUrls: []
})
export class LabelComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked, OnChanges {

    @Input() element: Element;
    @Input() styleClass: Object;
    @Input() classProperties: Object[];

    public settings: Object;

    private webFontLoaderInitialized: boolean = true;

    constructor() {

    }

    ngOnInit() { }

    initComponentInfo() {

        this.settings = {
            fieldLabel: this.initFieldLabelFromStyleClass(),
            labelFontFamily: this.styleClass['style']['font-family'],
            labelFontSize: this.styleClass['style']['font-size'],
            labelColor: this.styleClass['style']['color'],
            labelVPosition: this.styleClass['style']['text-valign'],
            labelHPosition: this.styleClass['style']['text-halign']
        };

        if (!this.settings['labelColor']) {
            this.settings['labelColor'] = '#000000';
        }

        if (!this.settings['labelFontSize']) {
            this.settings['labelFontSize'] = 16;
        } else {
            // clean pixels suffixes from font size value
            this.dropSuffixes();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.element && changes.styleClass) {     // we don't need to re-init if the new selected element belongs to the same class
            this.initComponentInfo();
            this.webFontLoaderInitialized = false;
        } else {
            console.log('Error: just element or style class changed during new element selection.');
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.initWebFontLoader();
        }, 200);    // not fully deterministic, but needed (node->edge menu loading is longer than edge->node menu loading)
    }

    ngAfterViewChecked() {
        if (!this.webFontLoaderInitialized) {
            this.initWebFontLoader();
        }
    }

    initWebFontLoader() {

        // deleting old webfont loader, if any
        (<any>$('#font')).remove();
        (<any>$('.font-select')).remove();

        // add the new input form
        (<any>$('#fontFamilyForm')).append('<input id="font" type="text">');

        let options: Object;
        if (this.settings['labelFontFamily'] !== undefined) {
            options = {
                placeholder: this.settings['labelFontFamily']
            };
        }

        if (options) {
            (<any>$('#font')).fontselect(options).change(() => {
                this.settings['labelFontFamily'] = $('#font').val();
            });
        } else {
            (<any>$('#font')).fontselect().change(() => {
                this.settings['labelFontFamily'] = $('#font').val();
            });
        }

        // webfont loader initialized, updating the ctrl variable
        this.webFontLoaderInitialized = true;
    }

    ngOnDestroy() { }

    dropSuffixes() {
        this.settings['labelFontSize'] = this.settings['labelFontSize'].replace('px', '');
    }

    initFieldLabelFromStyleClass() {
        let fieldLabel;
        if (this.styleClass['style']['label'] === '') {
            fieldLabel = '<empty>';
        } else {
            fieldLabel = this.styleClass['style']['label']
                .replace('data(', '')
                .replace(')', '');
            if (fieldLabel.startsWith('record.')) {
                fieldLabel = fieldLabel.replace('record.', '');
            }
        }
        return fieldLabel;
    }

    cleanLabelFamily() {

        if (this.settings['labelFontFamily']) {
            // replace + signs with spaces for css
            let font = (<any>this.settings['labelFontFamily']).replace(/\+/g, ' ');

            // split font into family and weight
            font = font.split(':');

            this.settings['labelFontFamily'] = font[0];
        }
    }

    getLabelSettings() {
        this.cleanLabelFamily();

        this.settings['fieldLabel'] = this.settings['fieldLabel'].replace('@', '');
        return this.settings;
    }

}
