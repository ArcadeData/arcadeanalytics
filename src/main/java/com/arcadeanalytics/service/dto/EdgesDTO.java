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

import java.util.Arrays;

public class EdgesDTO {

    private String[] nodeIds;
    private String[] edgeClasses;
    private String[] previousNodesIds;

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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EdgesDTO edgesDTO = (EdgesDTO) o;
        return Arrays.equals(nodeIds, edgesDTO.nodeIds) &&
                Arrays.equals(edgeClasses, edgesDTO.edgeClasses) &&
                Arrays.equals(previousNodesIds, edgesDTO.previousNodesIds);
    }

    @Override
    public int hashCode() {
        int result = Arrays.hashCode(nodeIds);
        result = 31 * result + Arrays.hashCode(edgeClasses);
        result = 31 * result + Arrays.hashCode(previousNodesIds);
        return result;
    }

    @Override
    public String toString() {
        return "EdgesDTO{" +
                "nodeIds=" + Arrays.toString(nodeIds) +
                ", edgeClasses=" + Arrays.toString(edgeClasses) +
                ", previousNodesIds=" + Arrays.toString(previousNodesIds) +
                '}';
    }
}
