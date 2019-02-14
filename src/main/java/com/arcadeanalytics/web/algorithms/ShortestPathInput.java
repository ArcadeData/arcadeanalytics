package com.arcadeanalytics.web.algorithms;

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
