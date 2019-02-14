package com.arcadeanalytics.web.algorithms;

class JungEdgeContent {

    private String id;
    private Number weight;

    public JungEdgeContent(String id, Number weight) {
        this.id = id;
        this.weight = weight;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Number getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public String toString() { // Always good for debugging
        return "E" + id;
    }

}