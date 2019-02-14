package com.arcadeanalytics.web.algorithms;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class ShortestPathResult {

    private final List path;
    private final Number distance;

    @JsonCreator
    public ShortestPathResult(@JsonProperty("path") List path,
                              @JsonProperty("distance") Number distance) {
        this.path = path;
        this.distance = distance;
    }

    public List getPath() {
        return path;
    }

    public Number getDistance() {
        return distance;
    }

    @Override
    public String toString() {
        return "ShortestPathResult{" + "path=" + path + ", distance=" + distance + '}';
    }
}
