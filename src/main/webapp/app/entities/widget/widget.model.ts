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
import { BaseEntity } from './../../shared';

export const enum WidgetType {
    GRAPH = 'graph',
    TEXTEDITOR = 'text-editor',
    TABLE = 'table',
    INDEPENDENT_PIE_CHART = 'independent-pie-chart',
    INDEPENDENT_BAR_CHART = 'independent-bar-chart',
    SECONDARY_PIE_CHART = 'secondary-pie-chart',
    SECONDARY_BAR_CHART = 'secondary-bar-chart'
}

export class Widget implements BaseEntity {
    constructor(
        public id?: number,
        public uuid?: string,
        public name?: string,
        public type?: WidgetType,
        public hasSnapshot?: boolean,
        public snapshots?: BaseEntity[],
        public dataSourceId?: number,
        public dashboardId?: number,
        public primaryWidgetId?: number,
        public shared?: boolean
    ) {
        this.type = WidgetType.GRAPH;
        this.shared = false;
    }
}
