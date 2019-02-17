package com.arcadeanalytics.service;

import com.arcadeanalytics.ArcadeanalyticsApp;
import com.arcadeanalytics.data.Sprite;
import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.DataSourceIndex;
import com.arcadeanalytics.domain.enumeration.DataSourceType;
import com.arcadeanalytics.repository.DataSourceRepository;
import com.arcadeanalytics.service.dto.SearchQueryDTO;
import com.google.common.collect.Sets;
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
import static java.util.Collections.emptySet;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class ElasticGraphIndexerServiceIntTest {

    @ClassRule
    public static GenericContainer container = new GenericContainer("arcadeanalytics/orientdb:2.2.36")
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
        dataSource = new DataSource()
            .name("demodb")
            .description("desc")
            .remote(false)
            .type(DataSourceType.ORIENTDB)
            .server(container.getContainerIpAddress())
            .port(container.getFirstMappedPort())
            .database("demodb")
            .username("admin")
            .password("admin");

        dataSourceRepository.save(dataSource);

        //when --> ASYNC!!!!!
        final DataSourceIndex index = service.index(dataSource).get();

        assertThat(index.getDocuments()).isEqualTo(22147);
        assertThat(index.getReport()).isEqualTo("Indexing completed");


    }

    @Test(expected = RuntimeException.class)
    public void shouldDeleteIndex() throws IOException {

        final boolean deleted = service.deleteIndex(dataSource);

        assertThat(deleted).isTrue();

        //should throw exception, index doesn't exist anymore
        SearchQueryDTO queryDTO = new SearchQueryDTO();
        service.search(dataSource, queryDTO);


    }

    @Test
    public void shouldFindSameDocumentsWithSimpleSearchAndFilteringOnIds() throws IOException {
        //then simple search for frank and rob
        SearchQueryDTO queryDTO = new SearchQueryDTO();
        //explicit OR 'cause default search are in AND
        queryDTO.setQuery("roma OR frank");
        List<Sprite> docs = service.search(dataSource, queryDTO);
        assertThat(docs).hasSize(10);

        String[] ids = docs.stream()
            .map(s -> s.valueOf(ARCADE_ID))
            .collect(Collectors.toList())
            .toArray(new String[]{});

        queryDTO = new SearchQueryDTO();
        queryDTO.setQuery("*:*");
        queryDTO.setIds(ids);
        //now search for all documents and filter by previous ids
        docs = service.search(dataSource, queryDTO);
        assertThat(docs).hasSize(10);

    }

    @Test
    public void shouldProvideFacetingOverNodesPropertyValues() throws IOException {
        //search for all
        SearchQueryDTO queryDTO = new SearchQueryDTO();
        queryDTO.setQuery("*:*");
        List<Sprite> docs = service.search(dataSource, queryDTO);

        //search limited to 10
        assertThat(docs).hasSize(10);

        String[] ids = docs.stream()
            .map(s -> s.valueOf(ARCADE_ID))
            .collect(Collectors.toList())
            .toArray(new String[]{});

        queryDTO = new SearchQueryDTO();
        queryDTO.setUseEdges(true);
        queryDTO.setIds(ids);

        final Map<String, Object> aggregate = service.aggregate(dataSource, queryDTO, emptySet(), emptySet(), 1, 20);

        assertThat(aggregate).containsKeys("Countries");

        final Map<String, Object> person = (Map<String, Object>) aggregate.get("Countries");

        assertThat(person).containsKeys("propertyValues", "doc_count");

        final Map<String, Object> propertyValues = (Map<String, Object>) person.get("propertyValues");

        assertThat(propertyValues).containsKeys("Code");
        assertThat(propertyValues).containsKeys("Name");

        final Map<String, Object> names = (Map<String, Object>) propertyValues.get("Code");

        assertThat(names).containsKeys("SK", "ZW", "SB");


    }

    @Test
    public void shouldProvideFacetingOverNodesPropertyValuesWithClassesAndProperty() throws IOException {
        //search for all
        SearchQueryDTO queryDTO = new SearchQueryDTO();
        queryDTO.setQuery("@class:Countries");
        List<Sprite> docs = service.search(dataSource, queryDTO);

        //search limited to 10
        assertThat(docs).hasSize(10);

        String[] ids = docs.stream()
            .map(s -> s.valueOf(ARCADE_ID))
            .collect(Collectors.toList())
            .toArray(new String[]{});

        queryDTO = new SearchQueryDTO();
        queryDTO.setUseEdges(true);
        queryDTO.setIds(ids);

        final Map<String, Object> aggregate = service.aggregate(dataSource, queryDTO, Sets.newHashSet("Countries"), Sets.newHashSet("Code"), 1, 20);

        assertThat(aggregate).containsKeys("Countries");

        final Map<String, Object> person = (Map<String, Object>) aggregate.get("Countries");

        assertThat(person).containsKeys("propertyValues", "doc_count");

        final Map<String, Object> propertyValues = (Map<String, Object>) person.get("propertyValues");

        assertThat(propertyValues).containsKeys("Code");
        assertThat(propertyValues).doesNotContainKeys("Name");

        final Map<String, Object> names = (Map<String, Object>) propertyValues.get("Code");

        assertThat(names).containsKeys("SK", "ZW", "SB");


    }


}
