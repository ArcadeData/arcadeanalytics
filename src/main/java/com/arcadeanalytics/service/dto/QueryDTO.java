package com.arcadeanalytics.service.dto;

public class QueryDTO {

    private String query;

    private int datasetCardinality;

    public int getDatasetCardinality() {
        return datasetCardinality;
    }

    public void setDatasetCardinality(int datasetCardinality) {
        this.datasetCardinality = datasetCardinality;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }


    @Override
    public String toString() {
        return "QueryDTO{" +
                "query='" + query + '\'' +
                ", datasetCardinality=" + datasetCardinality +
                '}';
    }
}
