export class WidgetConnectionRemovedMessage {

    constructor(public data: WidgetConnectionRemovedMessageContent) { }

}

export class WidgetConnectionRemovedMessageContent {
    primaryWidgetId: number;
    secondaryWidgetId: number;
}
