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
