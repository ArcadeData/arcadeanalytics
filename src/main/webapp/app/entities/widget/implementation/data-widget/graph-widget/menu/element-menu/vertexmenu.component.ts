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
import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { LabelComponent } from './label.component';
import { ShapeComponent } from './shape.component';
import { SettingsNodeClass } from '../../settingsnodeclass.component';
import { NotificationService } from '../../../../../../../shared';

@Component({
    selector: 'vertex-menu',
    templateUrl: 'vertexmenu.component.html',
    styleUrls: ['vertexmenu.component.scss']
})
export class VertexMenuComponent implements OnInit, OnDestroy, AfterViewInit {

    @Input() element: Element;
    @Input() styleClass: Object;
    @Input() nodeClassProperties: Object[];
    @Output() saveEmitter: EventEmitter<Object> = new EventEmitter();
    @Output() readyForHighlightEmitter: EventEmitter<Object> = new EventEmitter();

    @ViewChild('labelComponent') labelComponent: LabelComponent;
    @ViewChild('shapeComponent') shapeComponent: ShapeComponent;

    defaultNodeClassSettings: Object;

    // accordion style reference
    closeOthers: boolean = true;
    customPanel: string = 'custom-panel';
    customPanel2: string = 'custom-panel2';
    propertiesPanelOpen: boolean = true;
    labelPanelOpen: boolean = false;
    shapePanelOpen: boolean = false;

    constructor(protected notificationService: NotificationService) {
        // default classes settings
        this.defaultNodeClassSettings = new SettingsNodeClass();
    }

    ngOnInit() { }

    ngAfterViewInit() {
        this.initListenerOnAccordion(); // the isOpenChange output event of ngx-bootstrap does not work!
    }

    ngOnDestroy() { }

    initListenerOnAccordion() {
        (<any>$('.panel-heading')).bind('click', (event) => {
            setTimeout(() => {  // wait till the clicked accordion changes status
                const isOpenAttribute: string = (<any>$(event.currentTarget))
                .children('.panel-title')
                .children('.accordion-toggle')
                .attr('aria-expanded');
                let accordionIsOpen: boolean;
                if (isOpenAttribute === 'true') {
                    accordionIsOpen = true;
                } else if (isOpenAttribute === 'false') {
                    accordionIsOpen = false;
                } else {
                    console.log('VertexMenuComponent.initListenerOnAccordion(..): not admissible isOpenAttribute value.');
                }
                const accordionTitle = (<any>$(event.currentTarget)).children('div').text().trim();
                this.updateAccordionStatus(accordionTitle, accordionIsOpen);
            }, 50);
        });
    }

    updateAccordionStatus(accordionTitle: string, accordionIsOpen: boolean) {

        if (accordionTitle === 'Properties') {
            this.propertiesPanelOpen = accordionIsOpen;
            if (accordionIsOpen && this.closeOthers) {  // then accordion is mutual exclusive and the other boolean must be updated to false
                this.labelPanelOpen =  false;
                this.shapePanelOpen =  false;
            }
        } else if (accordionTitle === 'Label') {
            this.labelPanelOpen = accordionIsOpen;
            if (accordionIsOpen && this.closeOthers) {  // then accordion is mutual exclusive and the other boolean must be updated to false
                this.propertiesPanelOpen =  false;
                this.shapePanelOpen =  false;
            }
        } else if (accordionTitle === 'Shape') {
            this.shapePanelOpen = accordionIsOpen;
            if (accordionIsOpen && this.closeOthers) {  // then accordion is mutual exclusive and the other boolean must be updated to false
                this.propertiesPanelOpen =  false;
                this.labelPanelOpen =  false;
            }
        } else {
            console.log('VertexMenuComponent.updateAccordionStatus(..): not admissible accordionTitle value.');
        }
    }

    setPanelsStatus(propertiesPanelOpen, labelPanelOpen, shapePanelOpen) {
        this.propertiesPanelOpen = propertiesPanelOpen;
        this.labelPanelOpen = labelPanelOpen;
        this.shapePanelOpen = shapePanelOpen;
    }

    preparePanelForHighlighting() {
        this.setPanelsStatus(true, false, false);
        this.readyForHighlightEmitter.emit();
    }

    saveVertexSettings() {

        /*
         * Label settings
         */
        const labelSettings = this.labelComponent.getLabelSettings();

        if (labelSettings['fieldLabel']) {
            if (labelSettings['fieldLabel'] === 'id' || labelSettings['fieldLabel'] === 'class') {
                this.styleClass['style']['label'] = 'data(' + labelSettings['fieldLabel'] + ')';    // dynamic labeling
            } else if (labelSettings['fieldLabel'] === '<empty>') {
                this.styleClass['style']['label'] = '';
            } else {
                this.styleClass['style']['label'] = 'data(record.' + labelSettings['fieldLabel'] + ')';    // dynamic labeling
            }
        }
        this.styleClass['style']['color'] = labelSettings['labelColor'];
        this.styleClass['style']['font-family'] = labelSettings['labelFontFamily'];
        this.styleClass['style']['font-size'] = labelSettings['labelFontSize'];
        this.styleClass['style']['text-halign'] = labelSettings['labelHPosition'];
        this.styleClass['style']['text-valign'] = labelSettings['labelVPosition'];

        /*
         * Shape settings
         */
        const shapeSettings = this.shapeComponent.getShapeSettings();

        if (shapeSettings['fieldWeight']) {
            if (shapeSettings['sizingStrategy'] === 'fixed') {
                // fixed sizing
                if (!shapeSettings['shapeWidth'] || !shapeSettings['shapeHeight']) {
                    this.styleClass['style']['width'] = this.defaultNodeClassSettings['shapeWidth'];
                    this.styleClass['style']['height'] = this.defaultNodeClassSettings['shapeHeight'];
                } else {
                    this.styleClass['style']['width'] = shapeSettings['shapeWidth'];
                    this.styleClass['style']['height'] = shapeSettings['shapeHeight'];
                }
            } else {
                // linear sizing, aka dynamic weight sizing
                if (shapeSettings['fieldWeight'] === '<empty>') {
                    const message = 'Weight field not stated in linear sizing settings, please choose a valid field or choose the fixed size mode.';
                    this.notificationService.push('warning', 'Shape Sizing', message);
                    return;
                }
                const minLinearValue = shapeSettings['minLinearValue'].replace('px', '');
                const maxLinearValue = shapeSettings['maxLinearValue'].replace('px', '');
                this.styleClass['style']['width'] = 'mapData(record.' + shapeSettings['fieldWeight'] + ', minX, maxX, ' +
                    + minLinearValue + ', ' + maxLinearValue + ')';
                this.styleClass['style']['height'] = 'mapData(record.' + shapeSettings['fieldWeight'] + ', minX, maxX, ' +
                    + minLinearValue + ', ' + maxLinearValue + ')';
            }
        }

        this.styleClass['style']['background-color'] = shapeSettings['shapeColor'];
        if (shapeSettings['shapeImage']) {
            this.styleClass['style']['background-image'] = shapeSettings['shapeImage']['changingThisBreaksApplicationSecurity'];
        } else {
            // then we have to delete the background image, only if present
            if (this.styleClass['style']['background-image']) {
                delete this.styleClass['style']['background-image'];
            }
        }
        this.styleClass['style']['border-width'] = shapeSettings['borderWidth'];
        this.styleClass['style']['border-color'] = shapeSettings['borderColor'];

        // add background-fit 'none' if not present and if background-image is set
        if (this.styleClass['style']['background-image']) {
            this.styleClass['style']['background-fit'] = 'none';
            this.styleClass['style']['background-width'] = '70%';
            this.styleClass['style']['background-height'] = '70%';
        }

        this.saveEmitter.emit();
    }

}
