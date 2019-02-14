export class NewWidgetConnectionMessage {

    constructor(public data: NewWidgetConnectionMessageContent) { }

}

export class NewWidgetConnectionMessageContent {
    primaryWidgetId: number;
    secondaryWidgetId: number;
}
