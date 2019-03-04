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
