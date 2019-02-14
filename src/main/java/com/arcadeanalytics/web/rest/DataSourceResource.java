package com.arcadeanalytics.web.rest;

import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.provider.DataSourceGraphDataProvider;
import com.arcadeanalytics.provider.DataSourceGraphDataProviderFactory;
import com.arcadeanalytics.provider.DataSourceInfo;
import com.arcadeanalytics.provider.DataSourceMetadata;
import com.arcadeanalytics.provider.DataSourceMetadataProvider;
import com.arcadeanalytics.provider.DataSourceMetadataProviderFactory;
import com.arcadeanalytics.repository.DataSourceRepository;
import com.arcadeanalytics.repository.search.DataSourceSearchRepository;
import com.arcadeanalytics.security.AuthoritiesConstants;
import com.arcadeanalytics.security.SecurityUtils;
import com.arcadeanalytics.service.dto.DataSourceDTO;
import com.arcadeanalytics.service.mapper.DataSourceMapper;
import com.arcadeanalytics.service.util.DataSourceUtil;
import com.arcadeanalytics.web.rest.errors.BadRequestAlertException;
import com.arcadeanalytics.web.rest.util.HeaderUtil;
import com.arcadeanalytics.web.rest.util.PaginationUtil;
import com.codahale.metrics.annotation.Timed;
import io.github.jhipster.web.util.ResponseUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
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
 * REST controller for managing DataSource.
 */
@RestController
@RequestMapping("/api")
public class DataSourceResource {

    private static final String ENTITY_NAME = "dataSource";
    private final Logger log = LoggerFactory.getLogger(DataSourceResource.class);
    private final DataSourceRepository dataSourceRepository;


    private final DataSourceMapper dataSourceMapper;

    private final DataSourceSearchRepository dataSourceSearchRepository;

    private final CacheManager cacheManager;
    private final DataSourceGraphDataProviderFactory dataSourceGraphDataProviderFactory;
    private final DataSourceMetadataProviderFactory dataSourceMetadataProviderFactory;

    public DataSourceResource(DataSourceRepository dataSourceRepository,
                              DataSourceMapper dataSourceMapper,
                              DataSourceSearchRepository dataSourceSearchRepository,
                              CacheManager cacheManager,
                              DataSourceGraphDataProviderFactory dataSourceGraphDataProviderFactory,
                              DataSourceMetadataProviderFactory dataSourceMetadataProviderFactory) {
        this.dataSourceRepository = dataSourceRepository;
        this.dataSourceMapper = dataSourceMapper;
        this.dataSourceSearchRepository = dataSourceSearchRepository;
        this.cacheManager = cacheManager;
        this.dataSourceGraphDataProviderFactory = dataSourceGraphDataProviderFactory;
        this.dataSourceMetadataProviderFactory = dataSourceMetadataProviderFactory;
    }

    /**
     * POST  /data-sources : Create a new dataSource.
     *
     * @param dataSourceDTO the dataSourceDTO to create
     * @return the ResponseEntity with status 201 (Created) and with body the new dataSourceDTO, or with status 400 (Bad Request) if the dataSource has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/data-sources")
    @Timed
    public ResponseEntity<DataSourceDTO> createDataSource(@Valid @RequestBody DataSourceDTO dataSourceDTO) throws URISyntaxException {
        log.debug("REST request to save DataSource : {}", dataSourceDTO);
        if (dataSourceDTO.getId() != null) {
            throw new BadRequestAlertException("A new dataSource cannot already have an ID", ENTITY_NAME, "idexists");
        }
        DataSource dataSource = dataSourceMapper.toEntity(dataSourceDTO);
        dataSource = dataSourceRepository.save(dataSource);
        DataSourceDTO result = dataSourceMapper.toDto(dataSource);
        dataSourceSearchRepository.save(dataSource);
        return ResponseEntity.created(new URI("/api/data-sources/" + result.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
                .body(result);
    }

    /**
     * POST  /data-sources : test a data Source
     *
     * @param dataSourceDTO the dataSourceDTO to test
     * @return the ResponseEntity with status 201 (Created) and with body the new dataSourceDTO, or with status 400 (Bad Request) if the dataSource has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/data-sources/test")
    @Timed
    public ResponseEntity<Void> testDataSource(@RequestBody DataSourceDTO dataSourceDTO) throws URISyntaxException {
        log.info("REST request to test DataSource : {}", dataSourceDTO);

        DataSource dataSource = dataSourceMapper.toEntity(dataSourceDTO);

        log.info("DataSource : {}", dataSource);
        final DataSourceInfo dsInfo = DataSourceUtil.toDataSourceInfo(dataSource);
        DataSourceGraphDataProvider provider = dataSourceGraphDataProviderFactory.create(dsInfo);

        final boolean isConnectionOk = provider.testConnection(dsInfo);

        log.debug("REST request to test DataSource : {} - result {} ", dataSourceDTO, isConnectionOk);

        return ResponseEntity.ok()
                .headers(HeaderUtil.createAlert(HeaderUtil.APPLICATION_NAME + "." + ENTITY_NAME + ".connection.ok", dataSourceDTO.getDatabase()))
                .build();

    }

    /**
     * PUT  /data-sources : Updates an existing dataSource.
     *
     * @param dataSourceDTO the dataSourceDTO to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated dataSourceDTO,
     * or with status 400 (Bad Request) if the dataSourceDTO is not valid,
     * or with status 500 (Internal Server Error) if the dataSourceDTO couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/data-sources")
    @Timed
    public ResponseEntity<DataSourceDTO> updateDataSource(@Valid @RequestBody DataSourceDTO dataSourceDTO) throws URISyntaxException {
        log.debug("REST request to update DataSource : {}", dataSourceDTO);
        if (dataSourceDTO.getId() == null) {
            return createDataSource(dataSourceDTO);
        }
        DataSource dataSource = dataSourceMapper.toEntity(dataSourceDTO);
        dataSource = dataSourceRepository.save(dataSource);
        DataSourceDTO result = dataSourceMapper.toDto(dataSource);
        dataSourceSearchRepository.save(dataSource);
        return ResponseEntity.ok()
                .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, dataSourceDTO.getId().toString()))
                .body(result);
    }

    /**
     * GET  /data-sources : get all the dataSources.
     *
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of dataSources in body
     */
    @GetMapping("/data-sources")
    @Timed
    public ResponseEntity<List<DataSourceDTO>> getAllDataSources(Pageable pageable) {
        log.debug("REST request to get a page of DataSources");

        Page<DataSource> page;
        if (SecurityUtils.isCurrentUserInRole(AuthoritiesConstants.ADMIN)) {
            page = dataSourceRepository.findAll(pageable);
        } else {
            page = dataSourceRepository.findByWorkspaceUserUserLogin(SecurityUtils.getCurrentUserLogin().get(), pageable);
        }

        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/data-sources");
        return new ResponseEntity<>(dataSourceMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

    /**
     * GET  /data-sources/:id : get the "id" dataSource.
     *
     * @param id the id of the dataSourceDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the dataSourceDTO, or with status 404 (Not Found)
     */
    @GetMapping("/data-sources/{id}")
    @Timed
    public ResponseEntity<DataSourceDTO> getDataSource(@PathVariable Long id) {
        log.debug("REST request to get DataSource : {}", id);
        DataSource dataSource = dataSourceRepository.findOne(id);
        DataSourceDTO dataSourceDTO = dataSourceMapper.toDto(dataSource);
        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(dataSourceDTO));
    }

    /**
     * GET  /data-sources/:id : get the "id" dataSource.
     *
     * @param id the id of the dataSourceDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the dataSourceDTO, or with status 404 (Not Found)
     */
    @GetMapping("/data-sources/metadata/{id}")
    @Timed
    public ResponseEntity<DataSourceMetadata> getDataSourceMetadata(@PathVariable Long id) {
        log.debug("REST request to get DataSource : {}", id);

        DataSource dataSource = dataSourceRepository.findOne(id);

        final DataSourceInfo dsInfo = DataSourceUtil.toDataSourceInfo(dataSource);

        DataSourceMetadataProvider provider = dataSourceMetadataProviderFactory.create(dsInfo);
        final DataSourceMetadata metadata = provider.fetchMetadata(dsInfo);
        log.info("metadata for DataSource : {} - {}", id, metadata);
        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(metadata));
    }

    /**
     * DELETE  /data-sources/:id : delete the "id" dataSource.
     *
     * @param id the id of the dataSourceDTO to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/data-sources/{id}")
    @Timed
    public ResponseEntity<Void> deleteDataSource(@PathVariable Long id) {
        log.debug("REST request to delete DataSource : {}", id);
        dataSourceRepository.delete(id);
        dataSourceSearchRepository.delete(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }

    /**
     * SEARCH  /_search/data-sources?query=:query : search for the dataSource corresponding
     * to the query.
     *
     * @param query    the query of the dataSource search
     * @param pageable the pagination information
     * @return the result of the search
     */
    @GetMapping("/_search/data-sources")
    @Timed
    public ResponseEntity<List<DataSourceDTO>> searchDataSources(@RequestParam String query, Pageable pageable) {
        log.debug("REST request to search for a page of DataSources for query {}", query);
        Page<DataSource> page = dataSourceSearchRepository.search(queryStringQuery(query), pageable);
        HttpHeaders headers = PaginationUtil.generateSearchPaginationHttpHeaders(query, page, "/api/_search/data-sources");
        return new ResponseEntity<>(dataSourceMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

}
