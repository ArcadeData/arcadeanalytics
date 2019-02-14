package com.arcadeanalytics.web.rest;

import com.arcadeanalytics.domain.DataSourceIndex;
import com.arcadeanalytics.repository.DataSourceIndexRepository;
import com.arcadeanalytics.repository.search.DataSourceIndexSearchRepository;
import com.arcadeanalytics.service.dto.DataSourceIndexDTO;
import com.arcadeanalytics.service.mapper.DataSourceIndexMapper;
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

import javax.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Optional;

import static org.elasticsearch.index.query.QueryBuilders.queryStringQuery;

/**
 * REST controller for managing DataSourceIndex.
 */
@RestController
@RequestMapping("/api")
public class DataSourceIndexResource {

    private static final String ENTITY_NAME = "dataSourceIndex";
    private final Logger log = LoggerFactory.getLogger(DataSourceIndexResource.class);
    private final DataSourceIndexRepository dataSourceIndexRepository;

    private final DataSourceIndexMapper dataSourceIndexMapper;

    private final DataSourceIndexSearchRepository dataSourceIndexSearchRepository;

    public DataSourceIndexResource(DataSourceIndexRepository dataSourceIndexRepository, DataSourceIndexMapper dataSourceIndexMapper, DataSourceIndexSearchRepository dataSourceIndexSearchRepository) {
        this.dataSourceIndexRepository = dataSourceIndexRepository;
        this.dataSourceIndexMapper = dataSourceIndexMapper;
        this.dataSourceIndexSearchRepository = dataSourceIndexSearchRepository;
    }

    /**
     * POST  /data-source-indices : Create a new dataSourceIndex.
     *
     * @param dataSourceIndexDTO the dataSourceIndexDTO to create
     * @return the ResponseEntity with status 201 (Created) and with body the new dataSourceIndexDTO, or with status 400 (Bad Request) if the dataSourceIndex has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/data-source-indices")
    @Timed
    public ResponseEntity<DataSourceIndexDTO> createDataSourceIndex(@Valid @RequestBody DataSourceIndexDTO dataSourceIndexDTO) throws URISyntaxException {
        log.debug("REST request to save DataSourceIndex : {}", dataSourceIndexDTO);
        if (dataSourceIndexDTO.getId() != null) {
            throw new BadRequestAlertException("A new dataSourceIndex cannot already have an ID", ENTITY_NAME, "idexists");
        }
        DataSourceIndex dataSourceIndex = dataSourceIndexMapper.toEntity(dataSourceIndexDTO);
        dataSourceIndex = dataSourceIndexRepository.save(dataSourceIndex);
        DataSourceIndexDTO result = dataSourceIndexMapper.toDto(dataSourceIndex);
        dataSourceIndexSearchRepository.save(dataSourceIndex);
        return ResponseEntity.created(new URI("/api/data-source-indices/" + result.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
                .body(result);
    }

    /**
     * PUT  /data-source-indices : Updates an existing dataSourceIndex.
     *
     * @param dataSourceIndexDTO the dataSourceIndexDTO to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated dataSourceIndexDTO,
     * or with status 400 (Bad Request) if the dataSourceIndexDTO is not valid,
     * or with status 500 (Internal Server Error) if the dataSourceIndexDTO couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/data-source-indices")
    @Timed
    public ResponseEntity<DataSourceIndexDTO> updateDataSourceIndex(@Valid @RequestBody DataSourceIndexDTO dataSourceIndexDTO) throws URISyntaxException {
        log.debug("REST request to update DataSourceIndex : {}", dataSourceIndexDTO);
        if (dataSourceIndexDTO.getId() == null) {
            return createDataSourceIndex(dataSourceIndexDTO);
        }
        DataSourceIndex dataSourceIndex = dataSourceIndexMapper.toEntity(dataSourceIndexDTO);
        dataSourceIndex = dataSourceIndexRepository.save(dataSourceIndex);
        DataSourceIndexDTO result = dataSourceIndexMapper.toDto(dataSourceIndex);
        dataSourceIndexSearchRepository.save(dataSourceIndex);
        return ResponseEntity.ok()
                .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, dataSourceIndexDTO.getId().toString()))
                .body(result);
    }

    /**
     * GET  /data-source-indices : get all the dataSourceIndices.
     *
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of dataSourceIndices in body
     */
    @GetMapping("/data-source-indices")
    @Timed
    public ResponseEntity<List<DataSourceIndexDTO>> getAllDataSourceIndices(Pageable pageable) {
        log.debug("REST request to get a page of DataSourceIndices");
        Page<DataSourceIndex> page = dataSourceIndexRepository.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/data-source-indices");
        return new ResponseEntity<>(dataSourceIndexMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

    /**
     * GET  /data-source-indices/:id : get the "id" dataSourceIndex.
     *
     * @param id the id of the dataSourceIndexDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the dataSourceIndexDTO, or with status 404 (Not Found)
     */
    @GetMapping("/data-source-indices/{id}")
    @Timed
    public ResponseEntity<DataSourceIndexDTO> getDataSourceIndex(@PathVariable Long id) {
        log.debug("REST request to get DataSourceIndex : {}", id);
        DataSourceIndex dataSourceIndex = dataSourceIndexRepository.findOne(id);
        DataSourceIndexDTO dataSourceIndexDTO = dataSourceIndexMapper.toDto(dataSourceIndex);
        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(dataSourceIndexDTO));
    }

    /**
     * DELETE  /data-source-indices/:id : delete the "id" dataSourceIndex.
     *
     * @param id the id of the dataSourceIndexDTO to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/data-source-indices/{id}")
    @Timed
    public ResponseEntity<Void> deleteDataSourceIndex(@PathVariable Long id) {
        log.debug("REST request to delete DataSourceIndex : {}", id);
        dataSourceIndexRepository.delete(id);
        dataSourceIndexSearchRepository.delete(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }

    /**
     * SEARCH  /_search/data-source-indices?query=:query : search for the dataSourceIndex corresponding
     * to the query.
     *
     * @param query    the query of the dataSourceIndex search
     * @param pageable the pagination information
     * @return the result of the search
     */
    @GetMapping("/_search/data-source-indices")
    @Timed
    public ResponseEntity<List<DataSourceIndexDTO>> searchDataSourceIndices(@RequestParam String query, Pageable pageable) {
        log.debug("REST request to search for a page of DataSourceIndices for query {}", query);
        Page<DataSourceIndex> page = dataSourceIndexSearchRepository.search(queryStringQuery(query), pageable);
        HttpHeaders headers = PaginationUtil.generateSearchPaginationHttpHeaders(query, page, "/api/_search/data-source-indices");
        return new ResponseEntity<>(dataSourceIndexMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

}
