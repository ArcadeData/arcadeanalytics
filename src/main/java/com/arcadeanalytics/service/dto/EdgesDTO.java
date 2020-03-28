package com.arcadeanalytics.service.dto;

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

public class EdgesDTO {

    private String[] nodeIds;
    private String[] edgeClasses;
    private String[] previousNodesIds;
    private int datasetCardinality;

    public String[] getNodeIds() {
        return nodeIds;
    }

    public void setNodeIds(String[] nodeIds) {
        this.nodeIds = nodeIds;
    }

    public String[] getEdgeClasses() {
        return edgeClasses;
    }

    public void setEdgeClasses(String[] edgeClasses) {
        this.edgeClasses = edgeClasses;
    }

    public String[] getPreviousNodesIds() {
        return previousNodesIds;
    }

    public void setPreviousNodesIds(String[] previousNodesIds) {
        this.previousNodesIds = previousNodesIds;
    }

    public int getDatasetCardinality() {
        return datasetCardinality;
    }

    public void setDatasetCardinality(int datasetCardinality) {
        this.datasetCardinality = datasetCardinality;
    }
}
