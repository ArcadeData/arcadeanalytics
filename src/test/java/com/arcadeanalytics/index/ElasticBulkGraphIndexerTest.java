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

import com.arcadeanalytics.ArcadeanalyticsApp;
import com.arcadeanalytics.data.Sprite;
import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.enumeration.DataSourceType;
import com.arcadeanalytics.provider.DataSourceGraphProvider;
import com.arcadeanalytics.provider.DataSourceInfo;
import com.arcadeanalytics.provider.DataSourceProviderFactory;
import com.arcadeanalytics.service.util.DataSourceUtil;
import org.assertj.core.api.Assertions;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.action.search.SearchType;
import org.elasticsearch.client.Client;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.elasticsearch.core.ElasticsearchTemplate;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.time.LocalDate;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import java.util.stream.IntStream;

import static com.arcadeanalytics.index.IndexConstants.ARCADE_ID;
import static com.arcadeanalytics.index.IndexConstants.ARCADE_TYPE;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class ElasticBulkGraphIndexerTest {
    @Autowired
    public ElasticsearchTemplate searchTemplate;

    @Autowired
    DataSourceProviderFactory<DataSourceGraphProvider> graphProviderFactory;

    @Test
    public void shouldIndexGraphElements() {

        //given

        //data source not used for idexing
//        DataSource dataSource = new DataSource();
//        dataSource.setId(1L);
//        dataSource.name("testDataSource")
//            .type(DataSourceType.ORIENTDB)
//            .server("localhost")
//            .port(2424)
//            .database("PanamaPapers")
//            .username("admin")
//            .password("admin");


        ElasticBulkGraphIndexer indexer = new ElasticBulkGraphIndexer(searchTemplate.getClient(), "testindex");


        Supplier<Sprite> spriteSupplier = new Supplier<Sprite>() {
            int counter = 0;

            @Override
            public Sprite get() {
                return new Sprite()
                        .add(ARCADE_ID, "20_" + counter++)
                        .add(ARCADE_TYPE, "node")
                        .add("@class", "Person")
                        .add("name", "rob")
                        .add("surname", "frank")
                        .add("date", LocalDate.now().minusDays(counter));

            }
        };
        //when

        IntStream.range(0, 2000).boxed()
                .forEach(i -> indexer.play(spriteSupplier.get()));

        indexer.end();

        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        Client client = searchTemplate.getClient();
        SearchResponse searchResponse = client.prepareSearch("testindex")
                .setTypes("node")
                .setSearchType(SearchType.DFS_QUERY_THEN_FETCH)
                .setQuery(QueryBuilders.queryStringQuery("frank"))                 // Query
                .execute()
                .actionGet();


        Assertions.assertThat(searchResponse.getHits().getHits()).hasSize(10);


    }


    @Test
    @Ignore
    public void shouldIndexGraphElementsFromPanama() {

        DataSource dataSource = new DataSource();
        dataSource.setId(1L);
        dataSource.name("panamaPapers")
                .type(DataSourceType.ORIENTDB)
                .server("localhost")
                .port(2424)
                .database("PanamaPapers")
                .username("admin")
                .password("admin");


        ElasticBulkGraphIndexer indexer = new ElasticBulkGraphIndexer(searchTemplate.getClient(), dataSource.getId().toString());


        final DataSourceInfo dataSourceInfo = DataSourceUtil.toDataSourceInfo(dataSource);
        DataSourceGraphProvider provider = graphProviderFactory.create(dataSourceInfo);

        provider.provideTo(dataSourceInfo, indexer);

        search(dataSource, "singapore");

        search(dataSource, "type:edge");

    }

    private void search(DataSource dataSource, String query) {
        Client client = searchTemplate.getClient();
        SearchResponse searchResponse = client.prepareSearch(dataSource.getName().toLowerCase())
//            .setTypes("vertex")
                .setSearchType(SearchType.DFS_QUERY_THEN_FETCH)
                .setQuery(QueryBuilders.queryStringQuery(query))                 // Query
                .execute()
                .actionGet();

        SearchHit[] hits = searchResponse.getHits().getHits();

        System.out.println("---------results--------");
        for (SearchHit hit : hits) {

            System.out.println("hit.getSource() = " + hit.getSource());
        }
        System.out.println("-------------------------");
    }

}
