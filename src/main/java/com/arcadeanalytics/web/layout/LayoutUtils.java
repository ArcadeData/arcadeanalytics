package com.arcadeanalytics.web.layout;

import com.arcadeanalytics.provider.CytoData;
import com.arcadeanalytics.provider.GraphData;
import com.arcadeanalytics.provider.Position;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.google.common.base.Functions;
import edu.uci.ics.jung.algorithms.layout.AbstractLayout;
import edu.uci.ics.jung.algorithms.layout.CircleLayout;
import edu.uci.ics.jung.algorithms.layout.DAGLayout;
import edu.uci.ics.jung.algorithms.layout.SpringLayout2;
import edu.uci.ics.jung.algorithms.layout.StaticLayout;
import edu.uci.ics.jung.algorithms.util.IterativeContext;
import edu.uci.ics.jung.graph.DirectedSparseGraph;
import edu.uci.ics.jung.visualization.VisualizationImageServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.*;
import java.awt.geom.Point2D;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class LayoutUtils {
    private final Logger log = LoggerFactory.getLogger(LayoutUtils.class);

    public String applyLayout(final String layoutType, final String json) {
        final DirectedSparseGraph graph = new DirectedSparseGraph();

        final AbstractLayout layout;

        if (layoutType.equalsIgnoreCase("circle"))
            layout = new CircleLayout(graph);
        else if (layoutType.equalsIgnoreCase("spring"))
            layout = new SpringLayout2(graph);
        else if (layoutType.equalsIgnoreCase("DAG"))
            layout = new DAGLayout(graph);
        else
            throw new IllegalArgumentException("layoutType '" + layoutType + "' not supported");

        layout(layout, graph, json);

        log.info("Layout: executed layout, formatting response...");

        final StringBuilder buffer = new StringBuilder("{\"elements\":{\"nodes\":{");

        int i = 0;
        for (Object v : graph.getVertices()) {

            final double x = layout.getX(v);
            final double y = layout.getY(v);

            if (i > 0)
                buffer.append(",");
            buffer.append("\"");
            buffer.append(v);
            buffer.append("\": {\"x\":");
            buffer.append(x);
            buffer.append(",\"y\":");
            buffer.append(y);
            buffer.append("}");
            ++i;
        }

        buffer.append("}}}");

        log.info("Layout: send response back to the client");

        return buffer.toString();
    }

    public void layout(final AbstractLayout layout, final DirectedSparseGraph g, final GraphData graphData, final int viewPortWidth,
                       final int viewPortHeight) {
        for (CytoData node : graphData.getNodes())
            g.addVertex(node.getData().getId());

        for (CytoData edge : graphData.getEdges())
            g.addEdge(edge.getData().getId(), edge.getData().getSource(), edge.getData().getTarget());

        VisualizationImageServer vs = new VisualizationImageServer(layout, new Dimension(viewPortWidth, viewPortHeight));
        vs.getRenderingHints().remove(RenderingHints.KEY_ANTIALIASING);
        vs.doLayout();

        for (CytoData node : graphData.getNodes())
            node.setPosition(new Position(layout.getX(node.getData().getId()), layout.getY(node.getData().getId())));
    }

    public void layout(final AbstractLayout layout, final DirectedSparseGraph graph, final String json) {
        try {
            final JsonFactory jFactory = new JsonFactory();
            final JsonParser jParser = jFactory.createParser(json);

            ParserStatus status = ParserStatus.NO;

            String id = null;
            String source = null;
            String target = null;
            double x = 0;
            double y = 0;
            int viewPortWidth = 1200;
            int viewPortHeight = 800;
            int maxLayoutTime = 5;
            double graphSpacing = 0.085;
            boolean nodeLocked = false;

            final Map<String, Point2D> locationMap = new HashMap<>();

            log.info("Layout: parsing input JSON (length:{})", json.length());

            for (jParser.nextToken(); status != ParserStatus.END && jParser.hasCurrentToken(); jParser.nextToken()) {
                String fieldName = jParser.getCurrentName();
                if ("record".equals(fieldName)) {
                    jParser.skipChildren();
                } else if ("edges".equals(fieldName)) {
                    status = ParserStatus.EDGES; // EDGES
                    jParser.nextToken();
                } else if ("nodes".equals(fieldName)) {
                    status = ParserStatus.NODES; // EDGES
                    jParser.nextToken();
                } else if ("id".equals(fieldName)) {
                    jParser.nextToken();
                    id = jParser.getValueAsString();
                    if (status == ParserStatus.NODES) {
                    }
                } else if ("x".equals(fieldName)) {
                    jParser.nextToken();
                    x = jParser.getValueAsDouble();
                } else if ("graphSpacing".equals(fieldName)) {
                    jParser.nextToken();
                    graphSpacing = jParser.getValueAsDouble();
                } else if ("maxLayoutTime".equals(fieldName)) {
                    jParser.nextToken();
                    maxLayoutTime = jParser.getValueAsInt();
                } else if ("lock".equals(fieldName)) {
                    jParser.nextToken();
                    nodeLocked = jParser.getValueAsBoolean();
                } else if ("y".equals(fieldName)) {
                    jParser.nextToken();
                    y = jParser.getValueAsDouble();
                    if (status == ParserStatus.NODES) {
                        graph.addVertex(id);
                        locationMap.put(id, new Point2D.Double(x, y));
                        if (nodeLocked)
                            layout.lock(id, nodeLocked);
                        x = y = 0;
                        nodeLocked = false;
                    }
                } else if ("source".equals(fieldName)) {
                    jParser.nextToken();
                    source = jParser.getValueAsString();
                } else if ("target".equals(fieldName)) {
                    jParser.nextToken();
                    target = jParser.getValueAsString();
                    if (status == ParserStatus.EDGES) {
                        graph.addEdge(id, source, target);
                    }
                    id = source = target = null;
                } else if ("viewportSize".equals(fieldName)) {
                    status = ParserStatus.VIEWPORT;
                } else if ("width".equals(fieldName)) {
                    if (status == ParserStatus.VIEWPORT) {
                        jParser.nextToken();
                        viewPortWidth = jParser.getValueAsInt();
                        status = ParserStatus.END;
                    }
                } else if ("height".equals(fieldName)) {
                    if (status == ParserStatus.VIEWPORT) {
                        jParser.nextToken();
                        viewPortHeight = jParser.getValueAsInt();
                    }
                }
            }
            jParser.close();

            log.info("Layout: parsed input JSON, starting layout...");

            if (layout instanceof SpringLayout2) {
                ((SpringLayout2) layout).setForceMultiplier(graphSpacing);
                ((SpringLayout2) layout).setRepulsionRange((int) graphSpacing);
                ((SpringLayout2) layout).setStretch(graphSpacing);
                log.info("Spring Layout: nodes {}, attraction/repulsion {}", graph.getVertexCount(), graphSpacing);
            }

            double deltaGS = 0.5 + graphSpacing;
            if (deltaGS > 1) {
                // ENLARGE THE VIEWPORT ACCORDING TO THE GRAPH SPACING
                viewPortWidth *= deltaGS;
                viewPortHeight *= deltaGS;
                log.info("Layout: enlarge area to width:{}, height:{}", viewPortWidth, viewPortHeight);
            }

            viewPortWidth = 10000;
            viewPortHeight = 10000;

            layout.setInitializer(new StaticLayout(graph, Functions.forMap(locationMap)));

            VisualizationImageServer vs = new VisualizationImageServer(layout, new Dimension(viewPortWidth, viewPortHeight));

            Optional.ofNullable(vs.getModel().getRelaxer()).ifPresent(r -> r.setSleepTime(0));

            vs.getRenderingHints().remove(RenderingHints.KEY_ANTIALIASING);
            vs.doLayout();

            if (layout instanceof IterativeContext) {
                final long begin = System.currentTimeMillis();

                while (!((IterativeContext) layout).done()) {
                    if (System.currentTimeMillis() - begin > (maxLayoutTime * 1000)) {
                        // TIMEOUT
                        log.info("Layout: reached timeout of {} secs, display partial results", maxLayoutTime);
                        break;
                    }
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }

        } catch (IOException e) {
            throw new RuntimeException("Error on applying layout", e);
        }
    }

    enum ParserStatus {NO, NODES, EDGES, VIEWPORT, END}
}
