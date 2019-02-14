import { Subscription } from 'rxjs';

/**
 * It has a datasource, from which it can build and edit a dataset is owner of.
 * A primary widget must implement all the methods allowing data fetching from the datasource:
 * - loadDataFromQuery
 * - loadNodesFromIds
 * - loadElementsFromClasses
 *
 * One or more secondary widgets can be connected to a primary widget: in this case
 * secondary widgets will refer to the primary's dataset, but they will not able to edit it.
 */
export interface PrimaryWidget {

    subsetSelectionSubscription: Subscription;
    newDatasetToPropagate: boolean;

    /*
     * Methods
     */

    subscribeToEventBus();
    unsubscribeToEventBus();

    propagateDatasetMulticastChangeFromSnapshot(snapshot: Object): void;
    propagateDatasetTo(secondaryWidgetId: number): void;
    cleanDatasourceMetadataForSecondaryWidget(dataSourceMetadata: Object, elements: Object[]): Object;

    loadDataFromQuery(query: string, propagateNewDataset?: boolean);
    loadNodesFromIds(nodeIds: string[], propagateNewDataset?: boolean);
    loadElementsFromClasses(propagateNewDataset?: boolean);

    onSubsetSelection(data): void;
}
