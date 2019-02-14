package com.arcadeanalytics.web.rest;

import com.arcadeanalytics.domain.WidgetSnapshot;
import com.arcadeanalytics.repository.WidgetSnapshotRepository;
import com.arcadeanalytics.repository.search.WidgetSnapshotSearchRepository;
import com.arcadeanalytics.service.dto.WidgetSnapshotDTO;
import com.arcadeanalytics.service.mapper.WidgetSnapshotMapper;
import com.arcadeanalytics.web.rest.errors.BadRequestAlertException;
import com.arcadeanalytics.web.rest.util.HeaderUtil;
import com.arcadeanalytics.web.rest.util.PaginationUtil;
import com.codahale.metrics.annotation.Timed;
import io.github.jhipster.web.util.ResponseUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Optional;

import static org.elasticsearch.index.query.QueryBuilders.queryStringQuery;

/**
 * REST controller for managing WidgetSnapshot.
 */
@RestController
@RequestMapping("/api")
public class WidgetSnapshotResource {

    private static final String ENTITY_NAME = "widgetSnapshot";
    private final Logger log = LoggerFactory.getLogger(WidgetSnapshotResource.class);
    private final WidgetSnapshotRepository widgetSnapshotRepository;

    private final WidgetSnapshotMapper widgetSnapshotMapper;

    private final WidgetSnapshotSearchRepository widgetSnapshotSearchRepository;

    public WidgetSnapshotResource(WidgetSnapshotRepository widgetSnapshotRepository, WidgetSnapshotMapper widgetSnapshotMapper, WidgetSnapshotSearchRepository widgetSnapshotSearchRepository) {
        this.widgetSnapshotRepository = widgetSnapshotRepository;
        this.widgetSnapshotMapper = widgetSnapshotMapper;
        this.widgetSnapshotSearchRepository = widgetSnapshotSearchRepository;
    }

    /**
     * POST  /widget-snapshots : Create a new widgetSnapshot.
     *
     * @param widgetSnapshotDTO the widgetSnapshotDTO to create
     * @return the ResponseEntity with status 201 (Created) and with body the new widgetSnapshotDTO, or with status 400 (Bad Request) if the widgetSnapshot has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/widget-snapshots")
    @Timed
    public ResponseEntity<WidgetSnapshotDTO> createWidgetSnapshot(@RequestBody WidgetSnapshotDTO widgetSnapshotDTO) throws URISyntaxException {
        log.debug("REST request to save WidgetSnapshot : {}", widgetSnapshotDTO);
        if (widgetSnapshotDTO.getId() != null) {
            throw new BadRequestAlertException("A new widgetSnapshot cannot already have an ID", ENTITY_NAME, "idexists");
        }
        WidgetSnapshot widgetSnapshot = widgetSnapshotMapper.toEntity(widgetSnapshotDTO);
        widgetSnapshot = widgetSnapshotRepository.save(widgetSnapshot);
        WidgetSnapshotDTO result = widgetSnapshotMapper.toDto(widgetSnapshot);
        widgetSnapshotSearchRepository.save(widgetSnapshot);
        return ResponseEntity.created(new URI("/api/widget-snapshots/" + result.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
                .body(result);
    }

    /**
     * PUT  /widget-snapshots : Updates an existing widgetSnapshot.
     *
     * @param widgetSnapshotDTO the widgetSnapshotDTO to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated widgetSnapshotDTO,
     * or with status 400 (Bad Request) if the widgetSnapshotDTO is not valid,
     * or with status 500 (Internal Server Error) if the widgetSnapshotDTO couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/widget-snapshots")
    @Timed
    public ResponseEntity<WidgetSnapshotDTO> updateWidgetSnapshot(@RequestBody WidgetSnapshotDTO widgetSnapshotDTO) throws URISyntaxException {
        log.debug("REST request to update WidgetSnapshot : {}", widgetSnapshotDTO);
        if (widgetSnapshotDTO.getId() == null) {
            return createWidgetSnapshot(widgetSnapshotDTO);
        }
        WidgetSnapshot widgetSnapshot = widgetSnapshotMapper.toEntity(widgetSnapshotDTO);
        widgetSnapshot = widgetSnapshotRepository.save(widgetSnapshot);
        WidgetSnapshotDTO result = widgetSnapshotMapper.toDto(widgetSnapshot);
        widgetSnapshotSearchRepository.save(widgetSnapshot);
        return ResponseEntity.ok()
                .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, widgetSnapshotDTO.getId().toString()))
                .body(result);
    }

    /**
     * GET  /widget-snapshots : get all the widgetSnapshots.
     *
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of widgetSnapshots in body
     */
    @GetMapping("/widget-snapshots")
    @Timed
    public ResponseEntity<List<WidgetSnapshotDTO>> getAllWidgetSnapshots(Pageable pageable) {
        log.debug("REST request to get a page of WidgetSnapshots");
        Page<WidgetSnapshot> page = widgetSnapshotRepository.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/widget-snapshots");
        return new ResponseEntity<>(widgetSnapshotMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

    /**
     * GET  /widget-snapshots/:id : get the "id" widgetSnapshot.
     *
     * @param id the id of the widgetSnapshotDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the widgetSnapshotDTO, or with status 404 (Not Found)
     */
    @GetMapping("/widget-snapshots/{id}")
    @Timed
    public ResponseEntity<WidgetSnapshotDTO> getWidgetSnapshot(@PathVariable Long id) {
        log.debug("REST request to get WidgetSnapshot : {}", id);
        WidgetSnapshot widgetSnapshot = widgetSnapshotRepository.findOne(id);
        WidgetSnapshotDTO widgetSnapshotDTO = widgetSnapshotMapper.toDto(widgetSnapshot);
        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(widgetSnapshotDTO));
    }

    /**
     * DELETE  /widget-snapshots/:id : delete the "id" widgetSnapshot.
     *
     * @param id the id of the widgetSnapshotDTO to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/widget-snapshots/{id}")
    @Timed
    public ResponseEntity<Void> deleteWidgetSnapshot(@PathVariable Long id) {
        log.debug("REST request to delete WidgetSnapshot : {}", id);
        widgetSnapshotRepository.delete(id);
        widgetSnapshotSearchRepository.delete(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }

    /**
     * SEARCH  /_search/widget-snapshots?query=:query : search for the widgetSnapshot corresponding
     * to the query.
     *
     * @param query    the query of the widgetSnapshot search
     * @param pageable the pagination information
     * @return the result of the search
     */
    @GetMapping("/_search/widget-snapshots")
    @Timed
    public ResponseEntity<List<WidgetSnapshotDTO>> searchWidgetSnapshots(@RequestParam String query, Pageable pageable) {
        log.debug("REST request to search for a page of WidgetSnapshots for query {}", query);
        Page<WidgetSnapshot> page = widgetSnapshotSearchRepository.search(queryStringQuery(query), pageable);
        HttpHeaders headers = PaginationUtil.generateSearchPaginationHttpHeaders(query, page, "/api/_search/widget-snapshots");
        return new ResponseEntity<>(widgetSnapshotMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

}
