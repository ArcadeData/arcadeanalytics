import { Subscription } from 'rxjs';

/**
 * It has a datasource implicitly inferred from the primary widget is connected with.
 * The dataset is built and updated according to all the changes performed from the primary widget.
 * It cannot edit the dataset, but it can fire events that will trigger specific actions in the primary widget.
 * - selection
 * - unselection
 */
export interface SecondaryWidget {

    datasetUpdatedSubscription: Subscription;
    currentDataset: Object;

    /*
     * Methods
     */

    subscribeToEventBus();
    unsubscribeToEventBus();

    onDatasetUpdate(data: Object, metadata: Object): void;
    updateWidgetDataset(data): void;
    updateSecondaryMetadataFromPrimaryMetadata(metadata: Object): void;
    performFacetingForCurrentDataset(saveAfterUpdate?: boolean): void;

}
