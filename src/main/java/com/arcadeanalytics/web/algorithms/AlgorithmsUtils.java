package com.arcadeanalytics.web.algorithms;

import com.arcadeanalytics.provider.CytoData;
import com.arcadeanalytics.provider.GraphData;
import com.arcadeanalytics.web.layout.LayoutUtils;
import com.google.common.base.Function;
import edu.uci.ics.jung.algorithms.shortestpath.DijkstraShortestPath;
import edu.uci.ics.jung.graph.DirectedSparseGraph;
import edu.uci.ics.jung.graph.Graph;
import edu.uci.ics.jung.graph.UndirectedSparseGraph;
import edu.uci.ics.jung.graph.util.EdgeType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

public class AlgorithmsUtils {

    private final Logger log = LoggerFactory.getLogger(LayoutUtils.class);

    public ShortestPathResult performAlgorithm(final String algorithmName, final ShortestPathInput shortestPathInput) {

        GraphData graphData = shortestPathInput.getInputGraph();
        final Graph graph;
        final EdgeType edgeType;
        if (shortestPathInput.getShortestPathConfig().isDirected()) {
            graph = new DirectedSparseGraph();
            edgeType = EdgeType.DIRECTED;
        } else {
            graph = new UndirectedSparseGraph();
            edgeType = EdgeType.UNDIRECTED;
        }

        for (CytoData node : graphData.getNodes()) {
            graph.addVertex(node.getData().getId());
        }

        Map<String, String> edgeClass2weightField = shortestPathInput.getShortestPathConfig().getWeightFields();
        for (CytoData edge : graphData.getEdges()) {
            String edgeClass = edge.getClasses();
            if (edgeClass2weightField.containsKey(edgeClass)) {
                String weightField = edgeClass2weightField.get(edge.getClasses());
                Number weight = (Number) edge.getData().getRecord().get(weightField);
                graph.addEdge(new JungEdgeContent(edge.getData().getId(), weight), edge.getData().getSource(), edge.getData().getTarget(), edgeType);
            } else {
                graph.addEdge(new JungEdgeContent(edge.getData().getId(), 1), edge.getData().getSource(), edge.getData().getTarget(), edgeType);
            }
        }

        Function<JungEdgeContent, Number> weightFunction = (JungEdgeContent edge) -> edge.getWeight();

        if (algorithmName.equalsIgnoreCase("dijkstra")) {

            DijkstraShortestPath shortestPath = new DijkstraShortestPath(graph, weightFunction);
            List path = shortestPath.getPath(shortestPathInput.getSourceVertexId(), shortestPathInput.getTargetVertexId());
            Number distance = shortestPath.getDistance(shortestPathInput.getSourceVertexId(), shortestPathInput.getTargetVertexId());
            log.info("Dijkstra: algorithm executed, formatting response, sending response back to the client");

            return new ShortestPathResult(path, distance);
        }

        throw new IllegalArgumentException("layoutType '" + algorithmName + "' not supported");


    }
}
