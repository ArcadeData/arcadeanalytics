package com.arcadeanalytics.service.dto;

public class LoadElementsFromClassesDTO {

    private String[] classesNames;
    private int limit;
    private int datasetCardinality;

    public String[] getClassesNames() {
        return classesNames;
    }

    public void setClassesNames(String[] classesNames) {
        this.classesNames = classesNames;
    }

    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    public int getDatasetCardinality() {
        return datasetCardinality;
    }

    public void setDatasetCardinality(int datasetCardinality) {
        this.datasetCardinality = datasetCardinality;
    }

    @Override
    public String toString() {
        return "LoadElementsFromClassesDTO{" + "classesNames='" + classesNames + '\'' + ", limit=" + limit + '}';
    }
}
