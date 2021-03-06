package com.arcadeanalytics.web.rest;

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

import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.enumeration.IndexingStatus;
import com.arcadeanalytics.repository.DataSourceRepository;
import com.arcadeanalytics.security.AuthoritiesConstants;
import com.arcadeanalytics.security.SecurityUtils;
import com.arcadeanalytics.service.ElasticGraphIndexerService;
import com.arcadeanalytics.service.dto.SearchQueryDTO;
import com.arcadeanalytics.web.rest.util.HeaderUtil;
import com.codahale.metrics.annotation.Timed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * REST controller for managing Elasticsearch process.
 */
@RestController
@RequestMapping("/api")
public class DataSourceSearchResource {

    private final Logger log = LoggerFactory.getLogger(DataSourceSearchResource.class);

    private final DataSourceRepository dataSourceRepository;

    private final ElasticGraphIndexerService elasticGraphIndexerService;

    public DataSourceSearchResource(ElasticGraphIndexerService elasticGraphIndexerService,
                                    DataSourceRepository dataSourceRepository) {
        this.elasticGraphIndexerService = elasticGraphIndexerService;
        this.dataSourceRepository = dataSourceRepository;
    }

    /**
     * GET  /search/index/datasource/{id}  (Re)index a datasource
     *
     * @param id    the Datasource id
     * @param query the lucene query
     * @return 200ok if indexing was good
     */
    @GetMapping("/_search/data-sources/index/{id}")
    @Timed
    @Secured({AuthoritiesConstants.ADMIN, AuthoritiesConstants.USER})
    public ResponseEntity<Void> indexDatasource(@PathVariable Long id, @RequestParam(required = false) String... query) {
        DataSource dataSource = dataSourceRepository.findOne(id);

        if (dataSource.getIndexing() == IndexingStatus.INDEXING) {
            log.warn("REST request to reindex {} by user {} refused -> reindex still in progress", dataSource.getId(), SecurityUtils.getCurrentUserLogin());
            return ResponseEntity.unprocessableEntity()
                    .headers(HeaderUtil.createAlert("elasticsearch.reindex.refused", null))
                    .build();

        }
        log.info("REST request to reindex {} by user {} accepted", dataSource.getId(), SecurityUtils.getCurrentUserLogin());

        if (Objects.isNull(query))
            elasticGraphIndexerService.index(dataSource);
        else
            elasticGraphIndexerService.index(dataSource, query);

        return ResponseEntity.accepted()
                .headers(HeaderUtil.createAlert("elasticsearch.reindex.accepted", null))
                .build();
    }

    /**
     * DEL /search/index/datasource/{id} (Re)index a datasource
     *
     * @param id the Datasource id
     * @return the ResponseEntity with status 201 (deleted) and with body the new dataSourceDTO
     */
    @DeleteMapping("/_search/data-sources/index/{id}")
    @Timed
    @Secured({AuthoritiesConstants.ADMIN, AuthoritiesConstants.USER})
    public ResponseEntity<Void> deleteIndex(@PathVariable Long id) {
        DataSource dataSource = dataSourceRepository.findOne(id);
        log.info("REST request to delete index {} by user {}", dataSource.getId(), SecurityUtils.getCurrentUserLogin());

        elasticGraphIndexerService.deleteIndex(dataSource);

        return ResponseEntity.accepted()
                .headers(HeaderUtil.createAlert("elasticsearch.reindex.accepted", null))
                .build();
    }

    /**
     * GET  /search/index/data-source/aggregate/{id}
     * <p>
     * aggregate the whole data-source
     *
     * @param id                Datasource id
     * @param classes           set of classes
     * @param fields            set of fields
     * @param minDocCount       min doc count to include a facet
     * @param maxValuesPerField max valure to fetch per every field
     * @return the facet tree
     * @throws IOException if something goes wrong while aggregating
     */
    @GetMapping(value = "/_search/data-sources/aggregate/{id}")
    @Timed
    public ResponseEntity<Map<String, Object>> aggregate(@PathVariable Long id,
                                                         @RequestParam(required = false, defaultValue = "") Set<String> classes,
                                                         @RequestParam(required = false, defaultValue = "") Set<String> fields,
                                                         @RequestParam(required = false, defaultValue = "1") long minDocCount,
                                                         @RequestParam(required = false, defaultValue = "1000") int maxValuesPerField) throws IOException {
        DataSource dataSource = dataSourceRepository.findOne(id);
        log.info("REST request to aggregate {} by user {}", dataSource.getId(), SecurityUtils.getCurrentUserLogin());

        Map<String, Object> results = elasticGraphIndexerService.aggregateAndMap(dataSource, classes, fields, minDocCount, maxValuesPerField);

        return new ResponseEntity<>(results, HttpStatus.OK);
    }

    /**
     * POST  /search/index/data-source/aggregate/{id} aggregate the data-source using the id list provided inside {@link SearchQueryDTO} as filter
     *
     * @param id                Datasource id
     * @param query             the search query to be used as filter
     * @param classes           set of classes
     * @param fields            set of fields
     * @param minDocCount       min doc count to include a facet
     * @param maxValuesPerField max valure to fetch per every field
     * @return the facet tree
     * @throws IOException if something goes wrong while aggregating
     */
    @PostMapping(value = "/_search/data-sources/aggregate/{id}")
    @Timed
    public ResponseEntity<Map<String, Object>> aggregate(@PathVariable Long id,
                                                         @RequestBody SearchQueryDTO query,
                                                         @RequestParam(required = false, defaultValue = "") Set<String> classes,
                                                         @RequestParam(required = false, defaultValue = "") Set<String> fields,
                                                         @RequestParam(required = false, defaultValue = "1") long minDocCount,
                                                         @RequestParam(required = false, defaultValue = "15") int maxValuesPerField) throws IOException {
        DataSource dataSource = dataSourceRepository.findOne(id);
        log.info("REST request to aggregate {} by user {}", dataSource.getId(), SecurityUtils.getCurrentUserLogin());

        Map<String, Object> results = elasticGraphIndexerService.aggregateAndMap(dataSource, query, classes, fields, minDocCount, maxValuesPerField);

        return new ResponseEntity<>(results, HttpStatus.OK);
    }

    /**
     * SEARCH  /_search/data-sources/{id}/ search inside the dataSource for documents matching the query.
     *
     * @param id    the Datasource id
     * @param query the lucene query
     * @return the documents
     * @throws IOException is something goes wrong
     */
    @PostMapping(value = "/_search/data-sources/{id}", produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    @Timed
    public ResponseEntity<String> searchDataSource(@PathVariable Long id, @RequestBody SearchQueryDTO query) throws IOException {

        DataSource dataSource = dataSourceRepository.findOne(id);

        log.info("REST request to query {} by user {} ", dataSource.getId(), SecurityUtils.getCurrentUserLogin());

        String results = elasticGraphIndexerService.search(dataSource, query);

        return new ResponseEntity<>(results, HttpStatus.OK);
    }


}
