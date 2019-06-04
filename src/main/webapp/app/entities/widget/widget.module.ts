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
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ArcadeanalyticsSharedModule } from '../../shared';
import {
    WidgetService,
    WidgetPopupService,
    WidgetComponent,
    WidgetDetailComponent,
    WidgetEmbedComponent,
    WidgetNewDialogComponent,
    WidgetNewPopupComponent,
    WidgetEditPopupComponent,
    WidgetEditDialogComponent,
    WidgetDeletePopupComponent,
    WidgetDeleteDialogComponent,
    widgetRoute,
    widgetPopupRoute,
    WidgetResolvePagingParams,
    QueryWidgetComponent,
    GraphWidgetComponent,
    TableWidgetComponent,
    IndependentPieChartWidgetComponent,
    ElasticSecondaryPieChartWidgetComponent,
    QuerySecondaryPieChartWidgetComponent,
    IndependentBarChartWidgetComponent,
    ElasticSecondaryBarChartWidgetComponent,
    QuerySecondaryBarChartWidgetComponent,
    DataSourceInfoComponent,
    TimelineComponent,
    SaveOnExitPopupComponent,
    PerformQueryModalComponent,
    PerformTraverseModalComponent,
    ShortestPathConfigModalComponent,
    PageRankConfigModalComponent,
    CentralityConfigModalComponent,
    EmbedResourceModalComponent,
    AddEdgeModalComponent,
    AddNodeModalComponent,
    DirectAddEdgeModalComponent,
    EditElemPropertiesModalComponent,
    TextEditorWidgetComponent
} from './';
import {
    VertexMenuComponent,
    EdgeMenuComponent,
    TraverseMenuComponent,
    PropertiesComponent,
    LabelComponent,
    ShapeComponent,
    FulltextSearchComponent,
    FilterMenuComponent,
    SnapshotMenuComponent,
    QueryParameterComponent
} from './implementation/';
import { TableComponent } from './implementation/util-component/table';

const ENTITY_STATES = [
    ...widgetRoute,
    ...widgetPopupRoute,
];

@NgModule({
    imports: [
        ArcadeanalyticsSharedModule,
        RouterModule.forChild(ENTITY_STATES)
    ],
    declarations: [
        WidgetComponent,
        WidgetDetailComponent,
        WidgetEmbedComponent,
        WidgetNewDialogComponent,
        WidgetNewPopupComponent,
        WidgetEditPopupComponent,
        WidgetEditDialogComponent,
        WidgetDeletePopupComponent,
        WidgetDeleteDialogComponent,
        TextEditorWidgetComponent,
        QueryWidgetComponent,
        QueryParameterComponent,
        GraphWidgetComponent,
        TableWidgetComponent,
        IndependentPieChartWidgetComponent,
        ElasticSecondaryPieChartWidgetComponent,
        QuerySecondaryPieChartWidgetComponent,
        IndependentBarChartWidgetComponent,
        ElasticSecondaryBarChartWidgetComponent,
        QuerySecondaryBarChartWidgetComponent,
        TableComponent,
        DataSourceInfoComponent,
        VertexMenuComponent,
        EdgeMenuComponent,
        PropertiesComponent,
        LabelComponent,
        ShapeComponent,
        TraverseMenuComponent,
        FulltextSearchComponent,
        FilterMenuComponent,
        SnapshotMenuComponent,
        TimelineComponent,
        SaveOnExitPopupComponent,
        PerformQueryModalComponent,
        PerformTraverseModalComponent,
        ShortestPathConfigModalComponent,
        PageRankConfigModalComponent,
        CentralityConfigModalComponent,
        EmbedResourceModalComponent,
        AddEdgeModalComponent,
        AddNodeModalComponent,
        DirectAddEdgeModalComponent,
        EditElemPropertiesModalComponent
    ],
    entryComponents: [
        WidgetComponent,
        WidgetNewDialogComponent,
        WidgetNewPopupComponent,
        WidgetEditPopupComponent,
        WidgetEditDialogComponent,
        WidgetDeleteDialogComponent,
        WidgetDeletePopupComponent,
        TextEditorWidgetComponent,
        QueryWidgetComponent,
        QueryParameterComponent,
        GraphWidgetComponent,
        TableWidgetComponent,
        IndependentPieChartWidgetComponent,
        ElasticSecondaryPieChartWidgetComponent,
        QuerySecondaryPieChartWidgetComponent,
        IndependentBarChartWidgetComponent,
        ElasticSecondaryBarChartWidgetComponent,
        QuerySecondaryBarChartWidgetComponent,
        TableComponent,
        DataSourceInfoComponent,
        VertexMenuComponent,
        EdgeMenuComponent,
        PropertiesComponent,
        LabelComponent,
        ShapeComponent,
        TraverseMenuComponent,
        FulltextSearchComponent,
        FilterMenuComponent,
        SnapshotMenuComponent,
        TimelineComponent,
        SaveOnExitPopupComponent,
        PerformQueryModalComponent,
        PerformTraverseModalComponent,
        ShortestPathConfigModalComponent,
        PageRankConfigModalComponent,
        CentralityConfigModalComponent,
        EmbedResourceModalComponent,
        AddEdgeModalComponent,
        AddNodeModalComponent,
        DirectAddEdgeModalComponent,
        EditElemPropertiesModalComponent
    ],
    providers: [
        WidgetService,
        WidgetPopupService,
        WidgetResolvePagingParams,
    ],
    exports: [
        TextEditorWidgetComponent,
        QueryWidgetComponent,
        QueryParameterComponent,
        GraphWidgetComponent,
        TableWidgetComponent,
        IndependentPieChartWidgetComponent,
        ElasticSecondaryPieChartWidgetComponent,
        QuerySecondaryPieChartWidgetComponent,
        IndependentBarChartWidgetComponent,
        ElasticSecondaryBarChartWidgetComponent,
        QuerySecondaryBarChartWidgetComponent,
        TableComponent,
        DataSourceInfoComponent,
        TimelineComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArcadeanalyticsWidgetModule { }
