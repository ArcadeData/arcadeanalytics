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
    Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges,
    ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, AfterViewChecked
} from '@angular/core';
import { GraphWidgetComponent } from '../graphwidget.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,  // using it to avoid buggy 'ExpressionChangedAfterItHasBeenCheckedError' exception
    selector: 'traverse-menu',
    templateUrl: './traversemenu.component.html',
    styleUrls: ['traversemenu.component.scss']
})
export class TraverseMenuComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {

    @Input() nodes: any[];  // optional input field, if passed is used to automatically update the menu when the input nodes change,
                            // otherwise the menu must be manually updated by passing the actual elements in thebuildMenuitems
    @Input() parentComponent: GraphWidgetComponent;
    @Output() inputNodesRequestEmitter: EventEmitter<Object> = new EventEmitter();      // event emitter used to ask input nodes to build the traverse menu
    @Output() traverseRequestEmitter: EventEmitter<Object> = new EventEmitter();

    public outEdgeClass2count: Map<string, number> = new Map();
    public inEdgeClass2count: Map<string, number> = new Map();
    public outEdgeClass2countSize: number = 0;
    public inEdgeClass2countSize: number = 0;

    public outgoingEdgesCount: number;
    public incomingEdgesCount: number;

    // accordion style reference
    public customPanel: string = 'custom-panel';

    constructor(private cdr: ChangeDetectorRef) {}

    ngOnInit() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.nodes) {
            this.buildMenuItems(this.nodes);
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.inputNodesRequestEmitter.emit();
        }, 50);
    }

    ngAfterViewChecked() {
        // this.inputNodesRequestEmitter.emit();
    }

    ngOnDestroy() { }

    buildMenuItems(nodes: Object[]) {

        // cleaning collections
        this.outEdgeClass2count = new Map();
        this.inEdgeClass2count = new Map();
        this.outgoingEdgesCount = 0;
        this.incomingEdgesCount = 0;

        for (const node of nodes) {
            for (const property of Object.keys(node['data']['record']['@in'])) {
                const edgeClass = property;
                if (!this.inEdgeClass2count.has(edgeClass)) {
                    this.inEdgeClass2count.set(edgeClass, 0);
                }
                const currentCount = this.inEdgeClass2count.get(edgeClass);
                const deltaCount = node['data']['record']['@in'][edgeClass];
                const updatedCount = currentCount + deltaCount;
                this.inEdgeClass2count.set(edgeClass, updatedCount);
                this.incomingEdgesCount += deltaCount;
            }
            for (const property of Object.keys(node['data']['record']['@out'])) {
                const edgeClass = property;
                if (!this.outEdgeClass2count.has(edgeClass)) {
                    this.outEdgeClass2count.set(edgeClass, 0);
                }
                const currentCount = this.outEdgeClass2count.get(edgeClass);
                const deltaCount = node['data']['record']['@out'][edgeClass];
                const updatedCount = currentCount + deltaCount;
                this.outEdgeClass2count.set(edgeClass, updatedCount);
                this.outgoingEdgesCount += deltaCount;
            }
        }
        this.outEdgeClass2countSize = this.outEdgeClass2count.size;
        this.inEdgeClass2countSize = this.inEdgeClass2count.size;

        this.cdr.detectChanges();
    }

    traverse(edgeClass: string, direction: string) {

        const nodeIds = [];

        let nodes;
        if (this.nodes) {
            nodes = this.nodes;
        } else {
            // if we are using the mode without nodes-passing we need to ask the parent component for the the selected nodes
            nodes = this.parentComponent.getShownSelectedNodes();
        }
        nodes = nodes.filter((node) => {
            if (node['data']['arcadeElement']) {
                return false;
            }
            return true;
        });
        for (const node of nodes) {
            nodeIds.push(node['data']['id']);
        }

        let numberOfConnections: number;
        if (direction === 'in') {
            numberOfConnections = this.inEdgeClass2count.get(edgeClass);
        } else {
            numberOfConnections = this.outEdgeClass2count.get(edgeClass);
        }

        const eventInfo: Object = {
            nodeIds: nodeIds,
            edgeClass: edgeClass,
            direction: direction,
            numberOfConnections: numberOfConnections
        };
        this.traverseRequestEmitter.emit(eventInfo);
    }

}
