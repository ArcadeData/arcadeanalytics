export class DatasetUpdatedMessage {

    constructor(public data: DatasetUpdatedMessageContent) { }

}

export class DatasetUpdatedMessageContent {
    primaryWidgetId: number;
    secondaryWidgetId: number;
    data: Object[];
    metadata: Object;
}
