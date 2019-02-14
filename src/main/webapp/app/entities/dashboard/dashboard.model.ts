import { BaseEntity } from './../../shared';
import { Widget } from '../widget';

export class Dashboard implements BaseEntity {
    constructor(
        public id?: number,
        public name?: string,
        public description?: string,
        public widgets?: BaseEntity[],
        public layout?: Object,
        public workspaceId?: number,
        public shared?: boolean
    ) {
        this.widgets = [];
        this.layout = {};
        this.shared = false;
    }

    addWidget(widget: BaseEntity) {
        this.widgets.push(widget);
    }

    addWidgetLayoutInfo(widgetLayoutInfo: any) {
        if (!this.layout['widgetsLayoutInfo']) {
            const widgetId2widget = new Map();
            this.layout = {
                widgetsLayoutInfo: widgetId2widget
            };
        }
        this.layout['widgetsLayoutInfo'].set(widgetLayoutInfo['widgetId'], widgetLayoutInfo);
    }

    /**
     * It removes the widget from the widgets list in the dashboard.
     */
    removeWidgetById(id: number) {

        let i: number;
        for (i = 0; i < this.widgets.length; i++) {
            const currentWidget = this.widgets[i];
            if (currentWidget.id === id) {
                this.widgets.splice(i, 1);
                break;
            }
        }
    }

    /**
     * Used just to make Angular detect the changes inside the widgets array when an item is updated.
     */
    updateWidget(editedWidget: BaseEntity) {

        for (let i = 0; i < this.widgets.length; i++) {
            if (this.widgets[i]['id'] === editedWidget['id']) {
                this.widgets[i] = editedWidget;
                break;
            }
        }
    }
}
