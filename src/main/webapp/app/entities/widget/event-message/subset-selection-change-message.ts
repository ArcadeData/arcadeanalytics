export class SubsetSelectionChangeMessage {

    constructor(public data: SubsetSelectionChangeMessageContent) { }

}

export class SubsetSelectionChangeMessageContent {
    primaryWidgetId: number;
    secondaryWidgetId: number;
    class2property: Object[];
    propertyValues: string[];
}
