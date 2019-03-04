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
