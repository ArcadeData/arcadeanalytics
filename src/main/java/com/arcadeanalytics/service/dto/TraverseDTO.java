package com.arcadeanalytics.service.dto;

public class TraverseDTO {

    private String[] nodeIds;
    private String edgeClass;
    private String direction;
    private int datasetCardinality;

    public String[] getNodeIds() {
        return nodeIds;
    }

    public void setNodeIds(String[] nodeIds) {
        this.nodeIds = nodeIds;
    }

    public String getEdgeClass() {
        return this.edgeClass;
    }

    public void setEdgeClass(String edgeClass) {
        this.edgeClass = edgeClass;
    }

    public String getDirection() {
        return this.direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public int getDatasetCardinality() {
        return datasetCardinality;
    }

    public void setDatasetCardinality(int datasetCardinality) {
        this.datasetCardinality = datasetCardinality;
    }
}
