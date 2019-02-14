package com.arcadeanalytics.service.dto;

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
