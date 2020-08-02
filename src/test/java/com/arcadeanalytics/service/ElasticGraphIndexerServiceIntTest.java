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

import com.arcadeanalytics.ArcadeanalyticsApp;
import com.arcadeanalytics.data.Sprite;
import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.DataSourceIndex;
import com.arcadeanalytics.domain.enumeration.DataSourceType;
import com.arcadeanalytics.repository.DataSourceRepository;
import com.arcadeanalytics.service.dto.SearchQueryDTO;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.arcadeanalytics.index.IndexConstants.ARCADE_ID;
import static com.google.common.collect.Sets.newHashSet;
import static java.util.Collections.emptySet;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class ElasticGraphIndexerServiceIntTest {

    @ClassRule
    public static GenericContainer container = new GenericContainer("arcadeanalytics/orientdb3")
            .withExposedPorts(2424)
            .waitingFor(Wait.forListeningPort());

    private static String dbUrl;

    @Autowired
    public DataSourceRepository dataSourceRepository;

    @Autowired
    private ElasticGraphIndexerService service;

    private DataSource dataSource;

    @BeforeClass
    public static void beforeClass() {

    }


    @Before
    public void setUp() throws Exception {
        //given

        dataSource = dataSourceRepository.findByName("demodb").orElseGet(() ->
                dataSourceRepository.save(new DataSource()
                        .name("demodb")
                        .description("desc")
                        .remote(false)
                        .type(DataSourceType.ORIENTDB3)
                        .server(container.getContainerIpAddress())
                        .port(container.getFirstMappedPort())
                        .database("demodb")
                        .username("admin")
                        .password("admin"))
        );

        if (!service.hasIndex(dataSource)) {
            //when --> ASYNC!!!!!
            final DataSourceIndex index = service.index(dataSource).get();

            assertThat(index.getDocuments()).isEqualTo(22147);
            assertThat(index.getReport()).isEqualTo("Indexing completed");
        }

    }

    @Test(expected = RuntimeException.class)
    public void shouldDeleteIndex() throws IOException {

        assertThat(service.hasIndex(dataSource)).isTrue();

        final boolean deleted = service.deleteIndex(dataSource);

        assertThat(deleted).isTrue();

        //should throw exception, index doesn't exist anymore
        SearchQueryDTO queryDTO = new SearchQueryDTO();
        service.search(dataSource, queryDTO);

        assertThat(service.hasIndex(dataSource)).isFalse();

    }

    @Test
    public void shouldFindSameDocumentsWithSimpleSearchAndFilteringOnIds() throws IOException {
        //then simple search for frank and rob
        SearchQueryDTO queryDTO = new SearchQueryDTO();
        //explicit OR 'cause default search are in AND
        queryDTO.setQuery("Name:roma OR Name:frank");
        List<Sprite> docs = service.searchAndMap(dataSource, queryDTO);
        assertThat(docs).hasSize(9);

//        docs.forEach(sprite -> assertThat(sprite.valueOf("Name")).contains("frank", "roma", "Frank", "Roma"));

        String[] ids = docs.stream()
                .map(s -> s.valueOf(ARCADE_ID))
                .collect(Collectors.toList())
                .toArray(new String[]{});

        queryDTO = new SearchQueryDTO();
        queryDTO.setQuery("*:*");
        queryDTO.setIds(ids);
        //now search for all documents and filter by previous ids
        docs = service.searchAndMap(dataSource, queryDTO);
        assertThat(docs).hasSize(9);

//        docs.forEach(sprite -> assertThat(sprite.valueOf("Name")).contains("frank", "roma", "Frank", "Roma"));

    }

    @Test
    public void shouldProvideFacetingOverNodesPropertyValues() throws IOException {
        //search for all
        SearchQueryDTO queryDTO = new SearchQueryDTO();
        queryDTO.setQuery("@class:Countries");
        queryDTO.setNumOfDocuments(50);
        queryDTO.setUseEdges(false);

        List<Sprite> docs = service.searchAndMap(dataSource, queryDTO);

        //search limited to 50
        assertThat(docs).hasSize(50);

        //maps the ids of retrieved documents
        String[] ids = docs.stream()
                .map(s -> s.valueOf(ARCADE_ID))
                .collect(Collectors.toList())
                .toArray(new String[]{});

        queryDTO = new SearchQueryDTO();
        queryDTO.setUseEdges(false);
        queryDTO.setIds(ids);
        queryDTO.setNumOfDocuments(50);

        final Map<String, Object> aggregate = service.aggregateAndMap(dataSource, queryDTO, emptySet(), emptySet(), 1, 50);

        assertThat(aggregate).containsKeys("Countries");

        final Map<String, Object> person = (Map<String, Object>) aggregate.get("Countries");

        assertThat(person).containsKeys("propertyValues", "doc_count");

        final Map<String, Object> propertyValues = (Map<String, Object>) person.get("propertyValues");

        System.out.println("propertyValues = " + propertyValues);
        assertThat(propertyValues).containsKeys("Code");
        assertThat(propertyValues).containsKeys("Name");

        final Map<String, Object> names = (Map<String, Object>) propertyValues.get("Code");

        assertThat(names).containsKeys("CL", "GH", "GL");


    }

    @Test
    public void shouldProvideFacetingOverNodesPropertyValuesWithClassesAndProperty() throws IOException {
        //search for all
        SearchQueryDTO queryDTO = new SearchQueryDTO();
        queryDTO.setQuery("@class:Countries");
        List<Sprite> docs = service.searchAndMap(dataSource, queryDTO);

        //search limited to 10
        assertThat(docs).hasSize(10);

        String[] ids = docs.stream()
                .map(s -> s.valueOf(ARCADE_ID))
                .collect(Collectors.toList())
                .toArray(new String[]{});

        queryDTO = new SearchQueryDTO();
        queryDTO.setUseEdges(true);
        queryDTO.setIds(ids);

        final Map<String, Object> aggregate = service.aggregateAndMap(dataSource, queryDTO, newHashSet("Countries"), newHashSet("Code"), 1, 50);

        assertThat(aggregate).containsKeys("Countries");

        final Map<String, Object> person = (Map<String, Object>) aggregate.get("Countries");

        assertThat(person).containsKeys("propertyValues", "doc_count");

        final Map<String, Object> propertyValues = (Map<String, Object>) person.get("propertyValues");

        assertThat(propertyValues).containsKeys("Code");
        assertThat(propertyValues).doesNotContainKeys("Name");

        final Map<String, Object> names = (Map<String, Object>) propertyValues.get("Code");

        assertThat(names).containsKeys("CL", "GH", "GL");


    }


}
