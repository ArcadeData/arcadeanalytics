package com.arcadeanalytics.provider;

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

import com.arcadeanalytics.ArcadeanalyticsApp;
import com.carrotsearch.hppc.cursors.ObjectObjectCursor;
import com.google.common.collect.Maps;
import org.assertj.core.api.Assertions;
import org.elasticsearch.action.admin.indices.settings.get.GetSettingsResponse;
import org.elasticsearch.action.index.IndexResponse;
import org.elasticsearch.action.search.SearchRequestBuilder;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.action.search.SearchType;
import org.elasticsearch.client.Client;
import org.elasticsearch.client.Requests;
import org.elasticsearch.common.settings.Settings;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.highlight.HighlightBuilder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.elasticsearch.core.ElasticsearchTemplate;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)

public class ElasticSandoxIntTest {


    @Autowired
    public ElasticsearchTemplate searchTemplate;


    @Test
    public void reactorTest() {


    }

    @Test
    public void renameMe() {

        String indexName = "test";
//        searchTemplate.createIndex(indexName);

        Client client = searchTemplate.getClient();
        client.admin().indices()
            .create(Requests.createIndexRequest(indexName))
            .actionGet().isAcknowledged();
        Assertions.assertThat(searchTemplate.indexExists(indexName)).isTrue();


        Map<String, Object> document = Maps.newHashMap();
        document.put("name", "rob");
        document.put("surname", "frank");
        document.put("text", "I wake up in the morning and i drink a lot of coffee");
        document.put("date", new Date());


        IndexResponse indexResponse = client.prepareIndex(indexName, "vertex", "1")
            .setSource(document)
            .get();

        document = Maps.newHashMap();
        document.put("name", "andy");
        document.put("surname", "frank");
        document.put("text", "I go to sleep late in the evening");
        document.put("date", new Date());


        indexResponse = client.prepareIndex(indexName, "vertex", "2")
            .setSource(document)
            .get();


        System.out.println("indexResponse = " + indexResponse);


//        AdminClient admin = client.admin();
//        admin.indices().prepareFlush(indexName).setForce(true).get();


        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        SearchRequestBuilder searchRequestBuilder = client.prepareSearch("test")
//            .setTypes("vertex")
            .setSearchType(SearchType.DEFAULT)
//            .setQuery(QueryBuilders.termQuery("name", "andy"))                 // Query
            .setQuery(QueryBuilders.queryStringQuery("wake"));

//        HighlightBuilder highlightBuilder = new HighlightBuilder()
//            .postTags("<b>")
//            .preTags("</b>")
//            .field("text");


        searchRequestBuilder.addHighlightedField("text");

        SearchResponse searchResponse = searchRequestBuilder.get();
//        SearchResponse searchResponse = client.prepareSearch().execute().actionGet();

        System.out.println("searchResponse :: \n " + searchResponse);

        System.out.println(" =========== hits ===================== ");

        for (SearchHit hit : searchResponse.getHits().getHits()) {

            System.out.println("hit.getHighlightFields() = " + hit.getHighlightFields());
            System.out.println("hit = " + hit.getSource());
        }

        System.out.println(" ================================= ");

        GetSettingsResponse response = client.admin().indices()
            .prepareGetSettings(indexName).get();
        System.out.println("setting response = " + response);
        for (ObjectObjectCursor<String, Settings> cursor : response.getIndexToSettings()) {
            String index = cursor.key;
            Settings settings = cursor.value;
            Integer shards = settings.getAsInt("process.number_of_shards", null);
            Integer replicas = settings.getAsInt("process.number_of_replicas", null);
        }

    }

}
