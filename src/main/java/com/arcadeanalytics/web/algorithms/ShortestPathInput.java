package com.arcadeanalytics.web.algorithms;

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

import com.arcadeanalytics.provider.GraphData;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ShortestPathInput {

    private final GraphData inputGraph;
    private final String sourceVertexId;
    private final String targetVertexId;
    private final ShortestPathConfig shortestPathConfig;

    @JsonCreator
    public ShortestPathInput(@JsonProperty("inputGraph") GraphData inputGraph,
                             @JsonProperty("sourceVertexId") String sourceVertexId,
                             @JsonProperty("targetVertexId") String targetVertexId,
                             @JsonProperty("shortestPathConfig") ShortestPathConfig shortestPathConfig) {
        this.inputGraph = inputGraph;
        this.sourceVertexId = sourceVertexId;
        this.targetVertexId = targetVertexId;
        this.shortestPathConfig = shortestPathConfig;
    }

    public GraphData getInputGraph() {
        return inputGraph;
    }

    public String getSourceVertexId() {
        return sourceVertexId;
    }

    public String getTargetVertexId() {
        return targetVertexId;
    }

    public ShortestPathConfig getShortestPathConfig() {
        return shortestPathConfig;
    }

    @Override
    public String toString() {
        return "ShortestPathInput{" + "inputGraph=" + inputGraph + ", shortestPathConfig=" + shortestPathConfig + '}';
    }
}
