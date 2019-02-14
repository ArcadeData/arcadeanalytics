export class DatasetPropagationRequestMessage {

    constructor(public data: DatasetPropagationRequestMessageContent) { }

}

export class DatasetPropagationRequestMessageContent {
    primaryWidgetId: number;
    secondaryWidgetId: number;
}
