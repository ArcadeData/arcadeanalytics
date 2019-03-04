package com.arcadeanalytics.service;

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

import com.arcadeanalytics.provider.GraphData;
import com.arcadeanalytics.provider.Position;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.google.common.base.Functions;
import edu.uci.ics.jung.algorithms.layout.AbstractLayout;
import edu.uci.ics.jung.algorithms.layout.CircleLayout;
import edu.uci.ics.jung.algorithms.layout.DAGLayout;
import edu.uci.ics.jung.algorithms.layout.Layout;
import edu.uci.ics.jung.algorithms.layout.SpringLayout2;
import edu.uci.ics.jung.algorithms.layout.StaticLayout;
import edu.uci.ics.jung.algorithms.util.IterativeContext;
import edu.uci.ics.jung.graph.DirectedSparseGraph;
import edu.uci.ics.jung.graph.Graph;
import edu.uci.ics.jung.visualization.VisualizationImageServer;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.*;
import java.awt.geom.Point2D;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class LayoutService {
    private final Logger log = LoggerFactory.getLogger(LayoutService.class);

    public AbstractLayout applyLayout(final String layoutType, final String json) {

        final DirectedSparseGraph g = new DirectedSparseGraph();

        final AbstractLayout layout = getLayout(layoutType, g);

        layout(layout, json);

        return layout;
    }

    @NotNull
    public String toJson(AbstractLayout layout) {
        final StringBuilder buffer = new StringBuilder("{\"elements\":{\"nodes\":{");

        int i = 0;
        for (Object v : layout.getGraph().getVertices()) {

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

    @NotNull
    private AbstractLayout getLayout(final String layoutType, final DirectedSparseGraph g) {
        final AbstractLayout layout;

        if (layoutType.equalsIgnoreCase("circle"))
            layout = new CircleLayout(g);
        else if (layoutType.equalsIgnoreCase("spring"))
            layout = new SpringLayout2(g);
        else if (layoutType.equalsIgnoreCase("DAG"))
            layout = new DAGLayout(g);
        else
            throw new IllegalArgumentException("layoutType '" + layoutType + "' not supported");
        return layout;
    }

    public GraphData layout(final AbstractLayout layout,
                            final GraphData graphData,
                            final int viewPortWidth,
                            final int viewPortHeight) {

        final Graph g = layout.getGraph();
        graphData.getNodes().stream()
                .map(node -> node.getData().getId())
                .forEach(g::addVertex);

        graphData.getEdges()
                .forEach(edge -> g.addEdge(edge.getData().getId(), edge.getData().getSource(), edge.getData().getTarget()));

        VisualizationImageServer vs = new VisualizationImageServer(layout, new Dimension(viewPortWidth, viewPortHeight));
        vs.getRenderingHints()
                .remove(RenderingHints.KEY_ANTIALIASING);
        vs.doLayout();

        graphData.getNodes()
                .forEach(node -> node.setPosition(new Position(layout.getX(node.getData().getId()), layout.getY(node.getData().getId()))));

        return graphData;
    }

    private void layout(final Layout layout,
                        final String json) {
        //parse
        GraphJsonParser graphJsonParser = new GraphJsonParser();
        Map<String, Point2D> locationMap = graphJsonParser.parse(layout, json);
        int maxLayoutTime = graphJsonParser.getMaxLayoutTime();
        double graphSpacing = graphJsonParser.getGraphSpacing();

        //
        calcLayout(layout, maxLayoutTime, graphSpacing, locationMap);

    }

    private void calcLayout(Layout layout, int maxLayoutTime, double graphSpacing, Map<String, Point2D> locationMap) {
        if (layout instanceof SpringLayout2) {
            ((SpringLayout2) layout).setForceMultiplier(graphSpacing);
            ((SpringLayout2) layout).setRepulsionRange((int) graphSpacing);
            ((SpringLayout2) layout).setStretch(graphSpacing);
            log.info("Spring Layout: nodes {}, attraction/repulsion {}", layout.getGraph().getVertexCount(), graphSpacing);
        }

        int viewPortWidth = 10000;
        int viewPortHeight = 10000;

        layout.setInitializer(new StaticLayout(layout.getGraph(), Functions.forMap(locationMap)));
        VisualizationImageServer vs = new VisualizationImageServer(layout, new Dimension(viewPortWidth, viewPortHeight));
        vs.getModel()
                .getRelaxer()
                .setSleepTime(0);
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
    }

    enum ParserStatus {NO, NODES, EDGES, VIEWPORT, END}

    private class GraphJsonParser {
        private int maxLayoutTime;
        private double graphSpacing;

        public GraphJsonParser() {
        }

        public int getMaxLayoutTime() {
            return maxLayoutTime;
        }

        public double getGraphSpacing() {
            return graphSpacing;
        }


        public Map<String, Point2D> parse(final Layout layout, final String json) {
            try {
                final JsonFactory jFactory = new JsonFactory();
                final JsonParser jParser = jFactory.createParser(json);
                HashMap<String, Point2D> locationMap = new HashMap<>();

                final Graph g = layout.getGraph();

                String id = null;
                String source = null;
                String target = null;
                double x = 0;
                double y = 0;
                maxLayoutTime = 5;
                graphSpacing = 0.085;
                boolean nodeLocked = false;

                log.info("Layout: parsing input JSON (length:{})", json.length());

                ParserStatus status = ParserStatus.NO;
                for (jParser.nextToken(); status != ParserStatus.END; jParser.nextToken()) {
                    String fieldName = jParser.getCurrentName();
                    if ("edges".equals(fieldName)) {
                        status = ParserStatus.EDGES;
                        jParser.nextToken();
                    } else if ("nodes".equals(fieldName)) {
                        status = ParserStatus.NODES;
                        jParser.nextToken();
                    } else if ("id".equals(fieldName)) {
                        jParser.nextToken();
                        id = jParser.getValueAsString();
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
                            g.addVertex(id);
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
                            g.addEdge(id, source, target);
                        }
                        id = source = target = null;
                    } else if ("viewportSize".equals(fieldName)) {
                        status = ParserStatus.VIEWPORT;
                    } else if ("width".equals(fieldName)) {
                        if (status == ParserStatus.VIEWPORT) {
                            jParser.nextToken();
                            status = ParserStatus.END;
                        }
                    } else if ("height".equals(fieldName)) {
                        if (status == ParserStatus.VIEWPORT) {
                            jParser.nextToken();
                        }
                    }
                }
                jParser.close();
                log.info("Layout: parsed input JSON, starting layout...");
                return locationMap;
            } catch (IOException e) {
                throw new RuntimeException("Error on applying layout", e);
            }

        }
    }
}
