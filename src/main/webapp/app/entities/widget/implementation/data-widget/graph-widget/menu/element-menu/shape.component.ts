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
import { Component, OnInit, OnChanges, OnDestroy, AfterViewInit, Input, TemplateRef, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { WidgetService } from '../../../../../widget.service';
import { JhiEventManager } from 'ng-jhipster';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { Media } from '../../../../../../media/media.model';
import { MediaService } from '../../../../../../media/media.service';
import { ResponseWrapper } from '../../../../../../../shared/model/response-wrapper.model';
import { NotificationService } from 'app/shared';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'element-shape',
    templateUrl: 'shape.component.html',
    styleUrls: ['shape.component.scss']
})
export class ShapeComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

    @Input() element: Element;
    @Input() styleClass: Object;
    @Input() classProperties: Object[];

    // spinner
    showSpinner: boolean = false;

    // sizing strategy
    sizingStrategy: SizingStrategy = SizingStrategy.FIXED;

    /*
     * Media library modal
     */
    modalRef: BsModalRef;

    mediaResults: Media[];
    currentMediaSearch: string;
    itemsPerPage = 1600;

    settings: Object;
    category2media: Map<string, Object[]>;

    // default size bounds
    NODE_MIN_SIZE = 20;
    NODE_MAX_SIZE = 100;
    NODE_BORDER_MIN_SIZE = 1;
    NODE_BORDER_MAX_SIZE = 5;
    EDGE_MIN_SIZE = 1;
    EDGE_MAX_SIZE = 10;

    // Subscriber
    eventSubscriber: Subscription;

    constructor(private widgetService: WidgetService,
        private mediaService: MediaService,
        private modalService: BsModalService,
        private notificationService: NotificationService,
        private eventManager: JhiEventManager,
        private cdr: ChangeDetectorRef,
        private sanitizer: DomSanitizer) {
        this.category2media = new Map();
    }

    ngOnInit() {
        this.registerChangeInMedia();
        this.initAccordingToElementAndStyleClass();
        this.loadMedia();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.element && changes.styleClass) {
            this.initAccordingToElementAndStyleClass();
        } else {
            console.log('Error: just element or style class changed during new element selection.');
        }
    }

    ngAfterViewInit() { }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    initAccordingToElementAndStyleClass() {

        // setting class style from scratch

        if (this.element['type'] === 'v') {

            this.settings = {
                fieldWeight: this.initFieldWeightFromStyleClass(),
                minLinearValue: this.initLinearBound('min'),
                maxLinearValue: this.initLinearBound('max'),
                shapeWidth: this.initSizeField('width'),
                shapeHeight: this.initSizeField('height'),
                shapeColor: this.styleClass['style']['background-color'],
                borderWidth: this.styleClass['style']['border-width'],
                borderColor: this.styleClass['style']['border-color']
            };
            if (this.styleClass['style']['background-image']) {
                const dataImageUrl = this.sanitizer.bypassSecurityTrustUrl(this.styleClass['style']['background-image']);
                this.settings['shapeImage'] = dataImageUrl;
            }

            // sizing strategy init (default value is FIXED, overriding if needed)
            if (this.styleClass['style']['width'].includes('mapData') && this.styleClass['style']['height'].includes('mapData')) {
                this.sizingStrategy = SizingStrategy.LINEAR;
            }

        } else {
            this.settings = {
                fieldWeight: this.initFieldWeightFromStyleClass(),
                minLinearValue: this.initLinearBound('min'),
                maxLinearValue: this.initLinearBound('max'),
                lineWidth: this.initSizeField('width'),
                lineColor: this.styleClass['style']['line-color'],
                lineStyle: this.styleClass['style']['line-style'],
                targetArrowShape: this.styleClass['style']['target-arrow-shape'],
                targetArrowColor: this.styleClass['style']['target-arrow-color'],
                sourceArrowShape: this.styleClass['style']['source-arrow-shape'],
                sourceArrowColor: this.styleClass['style']['source-arrow-color']
            };

            // sizing strategy init (default value is FIXED, overriding if needed)
            if (this.styleClass['style']['width'].includes('mapData')) {
                this.sizingStrategy = SizingStrategy.LINEAR;
            }
        }

        // clean pixels suffixes
        this.dropSuffixes();
    }

    loadMedia() {
        const page: string = '0';
        const size: string = '1600';

        this.startSpinner();
        this.widgetService.loadMedia(page, size).subscribe((res: Object) => {
            for (const index of Object.keys(res)) {
                const currentMedia = res[index];
                const currentCategory = currentMedia['category'];
                if (!this.category2media.get(currentCategory)) {
                    this.category2media.set(currentCategory, []);
                }
                this.updateDataUrl(currentMedia);
                this.category2media.get(currentCategory).push(currentMedia);
            }
            this.stopSpinner();
        }, (error: HttpErrorResponse) => {
            this.stopSpinner();
            this.onError(error.error);
        });
    }

    /**
     * Modal search
     * @param event
     */

    handleSearchOnKeydown(event) {
        if (event.keyCode === 13) {
            this.search(this.currentMediaSearch);
        } else if (event.keyCode === 46 || event.keyCode === 8) {
            setTimeout(() => {
                if (this.currentMediaSearch === '') {
                    this.clear();
                }
            }, 10);
        }
    }

    search(query) {
        if (!query) {
            return this.clear();
        }
        this.currentMediaSearch = query;
        this.loadAll();
    }

    clear() {
        this.currentMediaSearch = '';
        this.mediaResults = [];
    }

    /**
     * Loads all the elements for the last selected page (this.page)
     */
    loadAll() {
        if (this.currentMediaSearch) {
            this.mediaService.search({
                page: 0,
                query: this.currentMediaSearch,
                size: this.itemsPerPage,
                // sort: this.sort()
            }).subscribe(
                (res: HttpResponse<Media[]>) => this.onSuccess(res.body, res.headers),
                (res: HttpErrorResponse) => this.onError(res.error)
            );
            return;
        }
        this.mediaService.query({
            page: 0,
            size: this.itemsPerPage,
            // sort: this.sort()
        }).subscribe(
            (res: HttpResponse<Media[]>) => this.onSuccess(res.body, res.headers),
            (res: HttpErrorResponse) => this.onError(res.error)
        );
    }

    updateDataUrl(media: Media) {
        const url = 'data:' + media['fileContentType'].replace(' ', '') + ';base64,' + media['file'];
        media['file'] = this.sanitizer.bypassSecurityTrustUrl(url);
    }

    dropSuffixes() {
        if (this.element['type'] === 'v') {
            this.settings['shapeWidth'] = this.settings['shapeWidth'].replace('px', '');
            this.settings['shapeHeight'] = this.settings['shapeHeight'].replace('px', '');
            this.settings['borderWidth'] = this.settings['borderWidth'].replace('px', '');
        } else {
            this.settings['lineWidth'] = this.settings['lineWidth'].replace('px', '');
        }
    }

    addSuffixes(settings: Object) {
        if (this.element['type'] === 'v') {
            settings['shapeWidth'] = settings['shapeWidth'] + 'px';
            settings['shapeHeight'] = settings['shapeHeight'] + 'px';
            settings['borderWidth'] = settings['borderWidth'] + 'px';
        } else {
            settings['lineWidth'] = settings['lineWidth'] + 'px';
        }
        settings['minLinearValue'] = settings['minLinearValue'] + 'px';
        settings['maxLinearValue'] = settings['maxLinearValue'] + 'px';
    }

    initFieldWeightFromStyleClass() {
        let fieldWeight;
        const expression: string = this.styleClass['style']['width'];
        if (expression.indexOf('mapData') >= 0) {   // checking if 'width' contains a mapData function ('width' contained both in nodes and edges)
            // linear size case
            fieldWeight = this.extractArgFromMapDataExpression(expression, 0);

            if (fieldWeight === 'edgeCount') {
                fieldWeight = '@' + fieldWeight;
            }
            if (fieldWeight.indexOf('record.') >= 0) {
                fieldWeight = fieldWeight.replace('record.', '');
            }
        } else {
            // fixed size case
            fieldWeight = '<empty>';
        }
        return fieldWeight;
    }

    /**
     * 0 : fieldName
     * 1 : minValue
     * 2 : maxValue
     * 3 : minMappedValue
     * 4 : maxMappedValue
     * @param argIndex
     */
    extractArgFromMapDataExpression(expression: string, argIndex: number) {
        let arg;
        if (expression.startsWith('record.')) {
            expression = expression.replace('record.', '');
        }
        expression = expression.replace('mapData(', '').replace(')', '');
        const exprArgs: string[] = expression.split(', ');
        arg = exprArgs[argIndex];
        return arg;
    }

    /**
     * 2 cases:
     * - linear size case: bounds are retrieved from the mapData expression
     * - fixed size: bounds are initialized to default values for edges and nodes
     * @param bound: min | max
     */
    initLinearBound(bound: string) {
        let value;
        if (this.styleClass['style']['width'].indexOf('mapData') >= 0) {
            // linear size case,
            if (this.element['type'] === 'v') {
                if (this.styleClass['style']['width'] && this.styleClass['style']['height']) {
                    // then extract values form the mapData expression
                    const expression = this.styleClass['style']['width'];      // 'width' field value and 'height' field value are equal
                    if (bound === 'min') {
                        value = this.extractArgFromMapDataExpression(expression, 3);
                    } else {
                        value = this.extractArgFromMapDataExpression(expression, 4);
                    }
                } else {
                    // default values
                    value = this.getDefaultBoundValue(bound);
                }
            } else {
                if (this.styleClass['style']['width']) {
                    // then extract values from the mapData expression
                    const expression = this.styleClass['style']['width'];
                    if (bound === 'min') {
                        value = this.extractArgFromMapDataExpression(expression, 3);
                    } else {
                        value = this.extractArgFromMapDataExpression(expression, 4);
                    }
                } else {
                    // default values
                    value = this.getDefaultBoundValue(bound);
                }
            }
        } else {
            // fixed size case, use default value for edges and nodes
            value = this.getDefaultBoundValue(bound);
        }
        return value;
    }

    getDefaultBoundValue(bound: string) {
        let boundValue;
        if (this.element['type'] === 'v') {
            if (bound === 'min') {
                boundValue = this.NODE_MIN_SIZE;
            } else if (bound === 'max') {
                boundValue = this.NODE_MAX_SIZE;
            }
        } else {
            if (bound === 'min') {
                boundValue = this.EDGE_MIN_SIZE;
            } else if (bound === 'max') {
                boundValue = this.EDGE_MAX_SIZE;
            }
        }
        return boundValue;
    }

    /**
     * Control function for linear size range values
     */
    forceNumericInputForLinearSizeRanges(currentEditingBound: string) {

        let updated: boolean = false;
        if (this.element['type'] === 'v') {
            // checking node bounds
            if (this.settings['minLinearValue'] < this.NODE_MIN_SIZE) {
                this.settings['minLinearValue'] = this.NODE_MIN_SIZE;
                updated = true;
            }
            if (this.settings['maxLinearValue'] > this.NODE_MAX_SIZE) {
                this.settings['maxLinearValue'] = this.NODE_MAX_SIZE;
                updated = true;
            }
        } else {
            // checking edge bounds
            if (this.settings['minLinearValue'] < this.EDGE_MIN_SIZE) {
                this.settings['minLinearValue'] = this.EDGE_MIN_SIZE;
                updated = true;
            }
            if (this.settings['maxLinearValue'] > this.EDGE_MAX_SIZE) {
                this.settings['maxLinearValue'] = this.EDGE_MAX_SIZE;
                updated = true;
            }
        }
        if (this.settings['minLinearValue'] >= this.settings['maxLinearValue']) {
            if (currentEditingBound === 'min') {
                this.settings['minLinearValue'] = this.settings['maxLinearValue'] - 1;
            } else if (currentEditingBound === 'max') {
                this.settings['maxLinearValue'] = this.settings['minLinearValue'] + 1;
            }
            updated = true;
        }

    }

    /**
     * Control function for linear size range values
     */
    forceNumericInputForElementSize(settingsProperty: string) {

        let updated: boolean = false;

        if (settingsProperty === 'shapeWidth' || settingsProperty === 'shapeHeight') {
            if (this.settings[settingsProperty] < this.NODE_MIN_SIZE) {
                this.settings[settingsProperty] = this.NODE_MIN_SIZE;
                updated = true;
            }
            if (this.settings[settingsProperty] > this.NODE_MAX_SIZE) {
                this.settings[settingsProperty] = this.NODE_MAX_SIZE;
                updated = true;
            }
        } else if (settingsProperty === 'borderWidth') {
            if (this.settings[settingsProperty] < this.NODE_BORDER_MIN_SIZE) {
                this.settings[settingsProperty] = this.NODE_BORDER_MIN_SIZE;
                updated = true;
            }
            if (this.settings[settingsProperty] > this.NODE_BORDER_MAX_SIZE) {
                this.settings[settingsProperty] = this.NODE_BORDER_MAX_SIZE;
                updated = true;
            }
        } else if (settingsProperty === 'lineWidth') {
            if (this.settings[settingsProperty] < this.EDGE_MIN_SIZE) {
                this.settings[settingsProperty] = this.EDGE_MIN_SIZE;
                updated = true;
            }
            if (this.settings[settingsProperty] > this.EDGE_MAX_SIZE) {
                this.settings[settingsProperty] = this.EDGE_MAX_SIZE;
                updated = true;
            }
        }

    }

    initSizeField(sizeField: string) {
        const valueExpression = this.styleClass['style'][sizeField];
        if (valueExpression.indexOf('mapData(') < 0) {
            // fixed size case
            return valueExpression;
        } else {
            // dynamic sizing case
            if (this.element['type'] === 'v') {
                return '20';      // width and height default value for nodes
            } else {
                return '1';      // width default value for edges
            }
        }
    }

    getShapeSettings() {

        // add suffixes
        const settings = JSON.parse(JSON.stringify(this.settings));
        settings['sizingStrategy'] = this.sizingStrategy;
        this.addSuffixes(settings);
        return settings;
    }

    cleanBackgroundImageField() {
        delete this.settings['shapeImage'];
    }

    openMediaLibrary(template: TemplateRef<any>) {
        this.modalRef = this.modalService.show(template);
    }

    updateImage(mediaUrl) {
        this.settings['shapeImage'] = mediaUrl;
        this.modalRef.hide();
    }

    registerChangeInMedia() {
        this.eventSubscriber = this.eventManager.subscribe(
            'mediaListModification',
            (response) => {
                if (response['content']['status'] === 'OK') {
                    const newMedia = response['content']['media'];
                    this.updateDataUrl(newMedia);
                    const category = newMedia['category'];
                    if (!this.category2media.get(category)) {
                        this.category2media.set(category, []);
                    }
                    this.category2media.get(category).push(newMedia);
                }
            });
    }

    private onSuccess(data, headers) {

        // updating data urls
        for (const media of data) {
            this.updateDataUrl(media);
        }

        this.mediaResults = data;
    }
    private onError(error) {
        console.log(error.message);
        const message: string = error.message;
        this.notificationService.push('error', 'Shape', message);
    }

    startSpinner() {
        // starting the spinner if not running
        if (!this.showSpinner) {
            this.showSpinner = true;
        }
    }

    stopSpinner() {
        // stopping the spinner if running
        if (this.showSpinner) {
            this.showSpinner = false;
        }
    }
}

export const enum SizingStrategy {
    FIXED = 'fixed',
    LINEAR = 'linear'
}
