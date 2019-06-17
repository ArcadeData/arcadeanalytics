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
import { Component, OnInit, OnDestroy, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { WidgetService } from '../../widget.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'fulltext-search',
    templateUrl: './fulltext-search.component.html',
    styleUrls: ['fulltext-search.component.scss']
})
export class FulltextSearchComponent implements OnInit, OnChanges, OnDestroy {

    @Input() searchTerm;
    @Input() datasourceId: number;
    @Input() componentHeight: string;
    @Output() queryEmitter: EventEmitter<Object> = new EventEmitter();
    @Output() noSuchIndexEmitter: EventEmitter<Object> = new EventEmitter();
    @Output() closeEmitter: EventEmitter<Object> = new EventEmitter();

    results: Object[] = [];
    selectedResultsId: Map<string, Object> = new Map();

    public resultContainerHeight: string;

    constructor(private widgetService: WidgetService,
        private notificationService: NotificationService) {
    }

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.datasourceId) {
            this.performFullTextSearch();
        }
        if (changes.componentHeight) {
            this.componentHeight = changes.componentHeight.currentValue.replace('px', '');
            this.resultContainerHeight = 0.81 * parseInt(this.componentHeight, 10) + 'px';
        }
    }

    performFullTextSearch() {
        this.widgetService.fulltextSearch(this.searchTerm, this.datasourceId)
            .subscribe((results: HttpResponse<Object[]>) => {
                const hits: Object[] = results.body['hits']['hits'];
                hits.forEach((hit) => {
                    const highlightProperty = Object.keys(hit['highlight'])[0]; // getting always the first property for the snippet
                    this.results.push({
                        source: hit['_source'],
                        snippet: hit['highlight'][highlightProperty]
                    });
                });
            }, (error: HttpErrorResponse) => {
                let message: string;
                let title: string;
                if (error['status'] === 500) {
                    title = 'No such index';
                    message = 'Error during the full text search query, please check if there is any full text index defined on data.\n' + '' +
                        'Remember, you can index your datasource through the specific button in the \'Search\' menu.';
                } else {
                    message = error.error['_body']['detail'];
                }
                this.notificationService.push('error', title, message);
                this.noSuchIndexEmitter.emit();
            });
    }

    ngOnDestroy() { }

    switchItemSelection(resultItem) {
        if (resultItem['source']['_a_selected'] !== undefined) {
            if (resultItem['source']['_a_selected'] === true) {
                resultItem['source']['_a_selected'] = false;
                this.removeSelected(resultItem);
            } else {
                resultItem['source']['_a_selected'] = true;
                this.addSelected(resultItem);
            }
        } else {
            resultItem['source']['_a_selected'] = true;
            this.addSelected(resultItem);
        }
    }

    removeSelected(result) {
        this.selectedResultsId.delete(result['source']['_a_id']);
    }

    addSelected(result: Object) {
        this.selectedResultsId.set(result['source']['_a_id'], result);
    }

    loadSelected() {
        const nodeIds: string[] = Array.from(this.selectedResultsId.keys());
        this.queryEmitter.emit(nodeIds);
        this.close();
    }

    close() {
        this.closeEmitter.emit();
    }

}
