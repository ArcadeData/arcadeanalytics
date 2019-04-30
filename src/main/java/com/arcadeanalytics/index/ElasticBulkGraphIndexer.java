package com.arcadeanalytics.index;

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

import com.arcadeanalytics.data.Sprite;
import com.arcadeanalytics.data.SpritePlayer;
import com.codahale.metrics.annotation.Timed;
import com.google.common.collect.Maps;
import org.elasticsearch.action.admin.indices.exists.indices.IndicesExistsResponse;
import org.elasticsearch.action.admin.indices.flush.FlushResponse;
import org.elasticsearch.action.bulk.BulkRequestBuilder;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.client.AdminClient;
import org.elasticsearch.client.Client;
import org.elasticsearch.client.IndicesAdminClient;
import org.elasticsearch.client.Requests;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import static com.arcadeanalytics.index.IndexConstants.ARCADE_ID;
import static com.arcadeanalytics.index.IndexConstants.ARCADE_TYPE;

/**
 * A {@link SpriteProcessor} able to index on Elastic a batch of {@link Sprite}s
 *
 * @author frank
 */
public class ElasticBulkGraphIndexer implements SpritePlayer {

    private final Logger log = LoggerFactory.getLogger(ElasticBulkGraphIndexer.class);

    private final Client client;
    private final String indexName;

    private final AtomicLong indexed;

    //STATE
    private BulkRequestBuilder bulkRequest;


    private Map<String, Integer> indexedByClass;

    /**
     * This processor uses the {@link Client}  to initialize the index with the given name on Elastic.
     * .
     *
     * @param client    the Elastic client
     * @param indexName the index where to store data
     */
    public ElasticBulkGraphIndexer(Client client, String indexName) {
        this.client = client;
        this.indexName = indexName;

        indexed = new AtomicLong();
        indexedByClass = Maps.newHashMap();

        IndicesAdminClient indices = client.admin().indices();

        IndicesExistsResponse existsResponse = indices
                .exists(Requests.indicesExistsRequest(indexName)).actionGet();

        //delete if present
        if (existsResponse.isExists())
            indices.delete(Requests.deleteIndexRequest(indexName))
                    .actionGet().isAcknowledged();

        indices.create(Requests.createIndexRequest(indexName))
                .actionGet().isAcknowledged();

        // MAPPING DONE

        client.admin().indices()
                .preparePutMapping(indexName)
                .setType("node")
                .setSource("{ \"dynamic_templates\": [\n" +
                        "      {\n" +
                        "          \"allfields\": {\n" +
                        "             \"match\": \"*\",\n" +
                        "             \"mapping\": {\n" +
                        "                \"type\": \"string\",\n" +
                        "                \"analyzer\": \"standard\",\n" +
                        "                \"term_vector\": \"with_positions_offsets\",\n" +
                        "                \"fields\": {\n" +
                        "                   \"raw\": {\n" +
                        "                      \"type\": \"string\",\n" +
                        "                      \"index\": \"not_analyzed\"\n" +
                        "                   }\n" +
                        "                }\n" +
                        "             }\n" +
                        "          }\n" +
                        "       }\n" +
                        "      ]\n" +
                        "    }\n" +
                        "}\n")
                .get();
        client.admin().indices()
                .preparePutMapping(indexName)
                .setType("edge")
                .setSource("{ \"dynamic_templates\": [\n" +
                        "      {\n" +
                        "          \"allfields\": {\n" +
                        "             \"match\": \"*\",\n" +
                        "             \"mapping\": {\n" +
                        "                \"type\": \"string\",\n" +
                        "                \"analyzer\": \"standard\",\n" +
                        "                \"term_vector\": \"with_positions_offsets\",\n" +
                        "                \"fields\": {\n" +
                        "                   \"raw\": {\n" +
                        "                      \"type\": \"string\",\n" +
                        "                      \"index\": \"not_analyzed\"\n" +
                        "                   }\n" +
                        "                }\n" +
                        "             }\n" +
                        "          }\n" +
                        "       }\n" +
                        "      ]\n" +
                        "    }\n" +
                        "}\n")
                .get();


        bulkRequest = client.prepareBulk();
    }


    @Override
    @Timed
    public void play(Sprite document) {

        final String id = document.valueOf(ARCADE_ID);
        final String type = document.valueOf(ARCADE_TYPE);

        bulkRequest.add(client.prepareIndex(indexName, type, id)
                .setSource(document.asMap()));

        String className = document.valueOf("@class");
        Integer count = indexedByClass.getOrDefault(className, 0);

        indexedByClass.put(className, count + 1);

        if (indexed.incrementAndGet() % 1000 == 0) {
            flushBulk();
        }
    }

    /**
     * Flushes the current bulk of documents and prepares the new one
     */
    private void flushBulk() {

        if (bulkRequest.numberOfActions() > 0) {
            log.info("sending bulk to index {} of size {} -  total indexed:: {} ", indexName, bulkRequest.numberOfActions(), indexed);

            BulkResponse bulkResponse = bulkRequest.get();

            if (bulkResponse.hasFailures()) {
                log.error(bulkResponse.buildFailureMessage());
            }
        }

        bulkRequest = client.prepareBulk();
    }

    @Override
    public void end() {

        flushBulk();

        log.info("flushing index {} - total docs indexed::  {}", indexName, indexed.get());
        log.info("indexed by class:: {}", indexedByClass);
        AdminClient admin = client.admin();
        FlushResponse flushResponse = admin.indices().prepareFlush(indexName).get();

    }

    @Override
    public long processed() {
        return indexed.get();
    }

    @Override
    public boolean accept(@NotNull Sprite sprite) {
        return true;
    }

    @NotNull
    @Override
    public void begin() {
    }
}
