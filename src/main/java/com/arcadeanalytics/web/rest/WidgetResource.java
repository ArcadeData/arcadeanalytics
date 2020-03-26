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

import com.arcadeanalytics.provider.GraphData;
import com.arcadeanalytics.service.WidgetService;
import com.arcadeanalytics.service.dto.*;
import com.arcadeanalytics.web.algorithms.ShortestPathInput;
import com.arcadeanalytics.web.algorithms.ShortestPathResult;
import com.arcadeanalytics.web.rest.errors.BadRequestAlertException;
import com.arcadeanalytics.web.rest.util.HeaderUtil;
import com.arcadeanalytics.web.rest.util.PaginationUtil;
import com.codahale.metrics.annotation.Timed;
import io.github.jhipster.web.util.ResponseUtil;
import io.swagger.annotations.ApiParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Optional;

/**
 * REST controller for managing Widget.
 */
@RestController
@RequestMapping("/api")
public class WidgetResource {

    private static final String ENTITY_NAME = "widget";
    private final Logger log = LoggerFactory.getLogger(WidgetResource.class);
    private final WidgetService widgetService;

    public WidgetResource(WidgetService widgetService) {
        this.widgetService = widgetService;
    }

    /**
     * POST  /widgets : Create a new widget.
     *
     * @param widgetDTO the widgetDTO to create
     * @return the ResponseEntity with status 201 (Created) and with body the new widgetDTO, or with status 400 (Bad Request) if the widget has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/widgets")
    @Timed
    public ResponseEntity<WidgetDTO> createWidget(@Valid @RequestBody WidgetDTO widgetDTO) throws URISyntaxException {
        log.debug("REST request to save Widget : {}", widgetDTO);
        if (widgetDTO.getId() != null) {
            throw new BadRequestAlertException("A new widget cannot already have an ID", ENTITY_NAME, "idexists");
        }

        WidgetDTO result = widgetService.save(widgetDTO, widgetDTO.getDataSourceId());
        return ResponseEntity.created(new URI("/api/widgets/" + result.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
                .body(result);
    }

    /**
     * PUT  /widgets : Updates an existing widget.
     *
     * @param widgetDTO the widgetDTO to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated widgetDTO,
     * or with status 400 (Bad Request) if the widgetDTO is not valid,
     * or with status 500 (Internal Server Error) if the widgetDTO couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/widgets")
    @Timed
    public ResponseEntity<WidgetDTO> updateWidget(@Valid @RequestBody WidgetDTO widgetDTO) throws URISyntaxException {
        log.debug("REST request to update Widget : {}", widgetDTO);
        if (widgetDTO.getId() == null) {
            return createWidget(widgetDTO);
        }
        WidgetDTO result = widgetService.save(widgetDTO);
        return ResponseEntity.ok()
                .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, widgetDTO.getId().toString()))
                .body(result);
    }

    /**
     * GET  /widgets : get all the widgets.
     *
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of widgets in body
     */
    @GetMapping("/widgets")
    @Timed
    public ResponseEntity<List<WidgetDTO>> getAllWidgets(@ApiParam Pageable pageable) {
        log.debug("REST request to get a page of Widgets");
        Page<WidgetDTO> page = widgetService.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/widgets");
        return new ResponseEntity<>(page.getContent(), headers, HttpStatus.OK);
    }

    /**
     * GET  /widgets : get all the widgets.
     *
     * @param id       {@link com.arcadeanalytics.domain.Dashboard} id
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of widgets in body
     */
    @GetMapping("/widgets/dashboard/{id}")
    @Timed
    public ResponseEntity<List<WidgetDTO>> getAllDashboardWidgets(@PathVariable Long id, @ApiParam Pageable pageable) {
        log.debug("REST request to get a page of Widgets");
        Page<WidgetDTO> page = widgetService.findAllByDashboard(id, pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/widgets");
        return new ResponseEntity<>(page.getContent(), headers, HttpStatus.OK);
    }

    /**
     * GET  /widgets/:id : get the "id" widget.
     *
     * @param id the id of the widgetDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the widgetDTO, or with status 404 (Not Found)
     */
    @GetMapping("/widgets/{id}")
    @Timed
    public ResponseEntity<WidgetDTO> getWidget(@PathVariable Long id) {
        log.debug("REST request to get Widget : {}", id);
        WidgetDTO widgetDTO = widgetService.findOne(id);


        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(widgetDTO));
    }

    /**
     * DELETE  /widgets/:id : delete the "id" widget.
     *
     * @param id the id of the widgetDTO to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/widgets/{id}")
    @Timed
    public ResponseEntity<Void> deleteWidget(@PathVariable Long id) {
        log.debug("REST request to delete Widget : {}", id);
        widgetService.delete(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }

    /**
     * SEARCH  /_search/widgets?query=:query : search for the widget corresponding
     * to the query.
     *
     * @param query    the query of the widget search
     * @param pageable the pagination information
     * @return the result of the search
     */
    @GetMapping("/_search/widgets")
    @Timed
    public ResponseEntity<List<WidgetDTO>> searchWidgets(@RequestParam String query, @ApiParam Pageable pageable) {
        log.debug("REST request to search for a page of Widgets for query {}", query);
        Page<WidgetDTO> page = widgetService.search(query, pageable);
        HttpHeaders headers = PaginationUtil.generateSearchPaginationHttpHeaders(query, page, "/api/_search/widgets");
        return new ResponseEntity<>(page.getContent(), headers, HttpStatus.OK);
    }


    @PostMapping("/widgets/data/{id}")
    @Timed
    public ResponseEntity<GraphData> getWidgetData(@PathVariable Long id, @RequestBody QueryDTO query) {
        log.debug("REST request to get Widget data : {} :: {}", id, query.getQuery());
        GraphData data = widgetService.getData(id, query);

        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(data));
    }

    @PostMapping("/widgets/table-data/{id}")
    @Timed
    public ResponseEntity<GraphData> getWidgetTableData(@PathVariable Long id, @RequestBody QueryDTO query) {
        log.debug("REST request to get Widget data : {} :: {}", id, query.getQuery());
        GraphData data = widgetService.getTableData(id, query);

        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(data));
    }


    @PostMapping("/widgets/traverse/{id}")
    @Timed
    public ResponseEntity<GraphData> traverse(@PathVariable Long id, @RequestBody TraverseDTO traverse) {
        log.debug("REST request to get Widget : {} :: {}", id, traverse.getNodeIds());
        GraphData data = widgetService.traverse(id, traverse);

        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(data));
    }

    @PostMapping("/widgets/relations/{id}")
    @Timed
    public ResponseEntity<GraphData> relations(@PathVariable Long id, @RequestBody RelationsDTO relations) {
        log.debug("REST request to get Widget : {} :: {}", id, relations.getNodeIds());
        GraphData data = widgetService.relations(id, relations);

        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(data));
    }

    @PostMapping("/widgets/load/{id}")
    @Timed
    public ResponseEntity<GraphData> load(@PathVariable Long id, @RequestBody SearchQueryDTO queryDTO) {
        log.debug("REST request to get Widget : {} :: {}", id, queryDTO.getIds());
        GraphData data = widgetService.load(id, queryDTO);

        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(data));
    }

    @PostMapping("/widgets/load-from-classes/{id}")
    @Timed
    public ResponseEntity<GraphData> loadFromClasses(@PathVariable Long id, @RequestBody LoadElementsFromClassesDTO loadElementsFromClassesDTO) {
        log.debug("REST request to get Widget : {} :: {} :: {}", id, loadElementsFromClassesDTO.getClassesNames(), loadElementsFromClassesDTO
                .getLimit());
        GraphData data = widgetService.loadElementsFromClasses(id, loadElementsFromClassesDTO);

        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(data));
    }

    @GetMapping(value = "/widgets/snapshot/{id}", produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    @Timed
    public ResponseEntity<String> getLatestWidgetSnapshot(@PathVariable Long id, @RequestParam(defaultValue = "last") String fileName) {
        log.debug("REST request to get Widget data : {} ", id);
        Optional<String> data = widgetService.getSnapshot(id, fileName);

        return ResponseUtil.wrapOrNotFound(data);
    }

    @DeleteMapping(value = "/widgets/snapshot/{id}", produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    @Timed
    public ResponseEntity<Boolean> deleteWidgetSnapshot(@PathVariable Long id, @RequestParam(defaultValue = "last") String fileName) {
        log.debug("REST request to delete Widget snapshot: {} ", fileName);

        return ResponseUtil.wrapOrNotFound(Optional.of(widgetService.deleteSnapshot(id, fileName)));
    }


    @GetMapping(value = "/widgets/snapshots/{id}", produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    @Timed
    public ResponseEntity<List<String>> getWidgetSnapshots(@PathVariable Long id) {
        log.debug("REST request to get Widget data : {} ", id);
        List<String> data = widgetService.getSnapshots(id);

        return ResponseEntity.ok(data);
    }

    @PutMapping(value = "/widgets/snapshot/{id}", consumes = MediaType.TEXT_PLAIN_VALUE)
    @Timed
    public ResponseEntity<Void> saveSnapshot(@PathVariable Long id, @RequestBody String json) {

        log.info("saving snapshot for widget {} ", id);

        widgetService.saveSnapshot(id, json);

        return ResponseEntity.noContent().build();
    }


    @PostMapping(value = "/widgets/layout/{layoutType}", produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    @Timed
    public ResponseEntity<String> layout(@PathVariable String layoutType, @RequestBody String json) {

        log.info("Applying layout {} ", layoutType);

        final String result = widgetService.layout(layoutType, json);

        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/widgets/algorithm/{algorithmName}")
    @Timed
    public ResponseEntity<ShortestPathResult> algorithm(@PathVariable String algorithmName, @RequestBody ShortestPathInput jsonAlgorithmInput) {

        log.info("Performing {} algorithm", algorithmName);

        final ShortestPathResult result = widgetService.performAlgorithm(algorithmName, jsonAlgorithmInput);

        return ResponseEntity.ok(result);
    }
}
