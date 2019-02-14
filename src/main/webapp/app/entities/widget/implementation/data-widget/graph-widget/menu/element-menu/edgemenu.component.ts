import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { LabelComponent } from './label.component';
import { ShapeComponent } from './shape.component';
import { SettingsEdgeClass } from '../../settingsedgeclass.component';
import { NotificationService } from '../../../../../../../shared';

@Component({
    selector: 'edge-menu',
    templateUrl: 'edgemenu.component.html',
    styleUrls: ['edgemenu.component.scss']
})
export class EdgeMenuComponent implements OnInit, OnDestroy, AfterViewInit {

    @Input() element: Element;
    @Input() styleClass: Object;
    @Input() edgeClassProperties: Object[];
    @Output() saveEmitter: EventEmitter<Object> = new EventEmitter();
    @Output() readyForHighlightEmitter: EventEmitter<Object> = new EventEmitter();

    @ViewChild('labelComponent') labelComponent: LabelComponent;
    @ViewChild('shapeComponent') shapeComponent: ShapeComponent;

    defaultEdgeClassSettings: Object;

    // accordion style reference
    closeOthers: boolean = true;
    customPanel: string = 'custom-panel';
    customPanel2: string = 'custom-panel2';
    propertiesPanelOpen: boolean = true;
    labelPanelOpen: boolean = false;
    shapePanelOpen: boolean = false;

    constructor(protected notificationService: NotificationService) {
        // default classes settings
        this.defaultEdgeClassSettings = new SettingsEdgeClass();
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
                    console.log('EdgeMenuComponent.initListenerOnAccordion(..): not admissible isOpenAttribute value.');
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
            console.log('EdgeMenuComponent.updateAccordionStatus(..): not admissible accordionTitle value.');
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

    saveEdgeSettings() {

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

        /*
         * Shape settings
         */
        const shapeSettings = this.shapeComponent.getShapeSettings();

        this.styleClass['style']['source-arrow-shape'] = shapeSettings['sourceArrowShape'];
        this.styleClass['style']['source-arrow-color'] = shapeSettings['sourceArrowColor'];
        this.styleClass['style']['target-arrow-shape'] = shapeSettings['targetArrowShape'];
        this.styleClass['style']['target-arrow-color'] = shapeSettings['targetArrowColor'];
        this.styleClass['style']['line-style'] = shapeSettings['lineStyle'];
        this.styleClass['style']['line-color'] = shapeSettings['lineColor'];

        if (shapeSettings['fieldWeight']) {
            if (shapeSettings['sizingStrategy'] === 'fixed') {
                // fixed sizing
                if (!shapeSettings['lineWidth']) {
                    this.styleClass['style']['width'] = this.defaultEdgeClassSettings['lineWidth'];
                } else {
                    this.styleClass['style']['width'] = shapeSettings['lineWidth'];
                }
            } else {
                if (shapeSettings['fieldWeight'] === '<empty>') {
                    const message = 'Weight field not stated in linear sizing settings, please choose a valid field or choose the fixed size mode.';
                    this.notificationService.push('warning', 'Shape Sizing', message);
                    return;
                }
                // linear sizing, aka dynamic weight sizing
                const minLinearValue = shapeSettings['minLinearValue'].replace('px', '');
                const maxLinearValue = shapeSettings['maxLinearValue'].replace('px', '');
                this.styleClass['style']['width'] = 'mapData(record.' + shapeSettings['fieldWeight'] + ', minX, maxX, ' +
                    + minLinearValue + ', ' + maxLinearValue + ')';
            }
        }

        this.saveEmitter.emit();
    }

}
