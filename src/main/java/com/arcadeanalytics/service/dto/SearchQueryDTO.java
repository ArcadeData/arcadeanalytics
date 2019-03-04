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

public class SearchQueryDTO {

    private String query;

    private String[] ids;

    private boolean useEdges;
    private int datasetCardinality;

    public SearchQueryDTO() {
        query = "*:*";
        ids = new String[]{};
        useEdges = false;
    }

    public boolean isUseEdges() {
        return useEdges;
    }

    public void setUseEdges(boolean useEdges) {
        this.useEdges = useEdges;
    }

    public String[] getIds() {
        return ids;
    }

    public void setIds(String[] ids) {
        this.ids = ids;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public int getDatasetCardinality() {
        return datasetCardinality;
    }

    public void setDatasetCardinality(int datasetCardinality) {
        this.datasetCardinality = datasetCardinality;
    }

    @Override
    public String toString() {
        return "SearchQueryDTO{" +
                "query='" + query + '\'' +
                ", ids=" + Arrays.toString(ids) +
                ", useEdges=" + useEdges +
                '}';
    }
}
