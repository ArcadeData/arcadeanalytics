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
