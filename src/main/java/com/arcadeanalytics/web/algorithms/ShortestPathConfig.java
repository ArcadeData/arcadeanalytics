package com.arcadeanalytics.web.algorithms;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

public class ShortestPathConfig {

    private final String executionAlgorithm;
    private final boolean directed;
    private final Map<String, String> weightFields;

    @JsonCreator
    public ShortestPathConfig(@JsonProperty("executionAlgorithm") String executionAlgorithm,
                              @JsonProperty("directed") boolean directed,
                              @JsonProperty("weightFields") Map<String, String> weightFields) {

        this.executionAlgorithm = executionAlgorithm;
        this.directed = directed;
        this.weightFields = weightFields;
    }

    public String getExecutionAlgorithm() {
        return executionAlgorithm;
    }

    public boolean isDirected() {
        return directed;
    }

    public Map<String, String> getWeightFields() {
        return weightFields;
    }

    @Override
    public String toString() {
        return "ShortestPathConfig{" + "executionAlgorithm='" + executionAlgorithm + '\'' + ", directed=" + directed + ", weightFields="
                + weightFields + '}';
    }
}
