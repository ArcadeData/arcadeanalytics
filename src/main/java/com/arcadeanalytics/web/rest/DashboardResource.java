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

import com.arcadeanalytics.domain.Dashboard;
import com.arcadeanalytics.repository.ArcadeUserRepository;
import com.arcadeanalytics.repository.DashboardRepository;
import com.arcadeanalytics.repository.search.DashboardSearchRepository;
import com.arcadeanalytics.security.AuthoritiesConstants;
import com.arcadeanalytics.security.SecurityUtils;
import com.arcadeanalytics.service.EnvironmentService;
import com.arcadeanalytics.service.dto.DashboardDTO;
import com.arcadeanalytics.service.mapper.DashboardMapper;
import com.arcadeanalytics.web.rest.errors.BadRequestAlertException;
import com.arcadeanalytics.web.rest.errors.InternalServerErrorException;
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
 * REST controller for managing Dashboard.
 */
@RestController
@RequestMapping("/api")
public class DashboardResource {

    private static final String ENTITY_NAME = "dashboard";

    private final Logger log = LoggerFactory.getLogger(DashboardResource.class);

    private final DashboardRepository dashboardRepository;

    private final DashboardMapper dashboardMapper;

    private final DashboardSearchRepository dashboardSearchRepository;

    private final EnvironmentService environmentService;

    private final ArcadeUserRepository arcadeUserRepository;


    public DashboardResource(DashboardRepository dashboardRepository,
                             DashboardMapper dashboardMapper,
                             DashboardSearchRepository dashboardSearchRepository,
                             EnvironmentService environmentService,
                             ArcadeUserRepository arcadeUserRepository) {
        this.dashboardRepository = dashboardRepository;
        this.dashboardMapper = dashboardMapper;
        this.dashboardSearchRepository = dashboardSearchRepository;
        this.environmentService = environmentService;
        this.arcadeUserRepository = arcadeUserRepository;
    }

    /**
     * POST  /dashboards : Create a new dashboard.
     *
     * @param dashboardDTO the dashboardDTO to create
     * @return the ResponseEntity with status 201 (Created) and with body the new dashboardDTO, or with status 400 (Bad Request) if the dashboard has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/dashboards")
    @Timed
    public ResponseEntity<DashboardDTO> createDashboard(@Valid @RequestBody DashboardDTO dashboardDTO) throws URISyntaxException {
        log.debug("REST request to save Dashboard : {}", dashboardDTO);
        if (dashboardDTO.getId() != null) {
            throw new BadRequestAlertException("A new dashboard cannot already have an ID", ENTITY_NAME, "idexists");
        }

        final List<Dashboard> dashboards = dashboardRepository.findByWorkspaceUserUserLogin(SecurityUtils.getCurrentUserLogin().get());

        int maxDashboardSize = arcadeUserRepository.findByUserLogin(SecurityUtils.getCurrentUserLogin().get())
                .get()
                .getCompany()
                .getContract()
                .getMaxDashboards();
        if (dashboards.size() == maxDashboardSize) {
            throw new InternalServerErrorException("No more dashboard can be created, max number is: " + maxDashboardSize);
        }


        Dashboard dashboard = dashboardMapper.toEntity(dashboardDTO);
        dashboard = dashboardRepository.save(dashboard);

        DashboardDTO result = dashboardMapper.toDto(dashboard);
        dashboardSearchRepository.save(dashboard);
        return ResponseEntity.created(new URI("/api/dashboards/" + result.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
                .body(result);
    }

    /**
     * PUT  /dashboards : Updates an existing dashboard.
     *
     * @param dashboardDTO the dashboardDTO to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated dashboardDTO,
     * or with status 400 (Bad Request) if the dashboardDTO is not valid,
     * or with status 500 (Internal Server Error) if the dashboardDTO couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/dashboards")
    @Timed
    public ResponseEntity<DashboardDTO> updateDashboard(@Valid @RequestBody DashboardDTO dashboardDTO) throws URISyntaxException {
        log.info("REST request to update Dashboard : {}", dashboardDTO);
        if (dashboardDTO.getId() == null) {
            return createDashboard(dashboardDTO);
        }
        Dashboard dashboard = dashboardMapper.toEntity(dashboardDTO);
        dashboard = dashboardRepository.save(dashboard);
        DashboardDTO result = dashboardMapper.toDto(dashboard);
        dashboardSearchRepository.save(dashboard);
        return ResponseEntity.ok()
                .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, dashboardDTO.getId().toString()))
                .body(result);
    }

    /**
     * GET  /dashboards : get all the dashboards.
     *
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of dashboards in body
     */
    @GetMapping("/dashboards")
    @Timed
    public ResponseEntity<List<DashboardDTO>> getAllDashboards(Pageable pageable) {
        log.debug("REST request to get a page of Dashboards");

        Page<Dashboard> page;
        if (SecurityUtils.isCurrentUserInRole(AuthoritiesConstants.ADMIN)) {
            page = dashboardRepository.findAll(pageable);
        } else {
            page = dashboardRepository.findByWorkspaceUserUserLogin(SecurityUtils.getCurrentUserLogin().get(), pageable);
        }

        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/dashboards");
        return new ResponseEntity<>(dashboardMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

    /**
     * GET  /dashboards/:id : get the "id" dashboard.
     *
     * @param id the id of the dashboardDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the dashboardDTO, or with status 404 (Not Found)
     */
    @GetMapping("/dashboards/{id}")
    @Timed
    public ResponseEntity<DashboardDTO> getDashboard(@PathVariable Long id) {
        log.debug("REST request to get Dashboard : {}", id);

        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(getDashboardIfAllowed(id)
                .map(d -> dashboardMapper.toDto(d))
                .orElse(null)));
    }


    /**
     * DELETE  /dashboards/:id : delete the "id" dashboard.
     *
     * @param id the id of the dashboardDTO to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/dashboards/{id}")
    @Timed
    public ResponseEntity<Void> deleteDashboard(@PathVariable Long id) {
        log.debug("REST request to delete Dashboard : {}", id);

        getDashboardIfAllowed(id)
                .ifPresent(d -> {
                    environmentService.deleteDashboard(d);
                    dashboardSearchRepository.delete(id);
                });

        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }

    /**
     * SEARCH  /_search/dashboards?query=:query : search for the dashboard corresponding
     * to the query.
     *
     * @param query    the query of the dashboard search
     * @param pageable the pagination information
     * @return the result of the search
     */
    @GetMapping("/_search/dashboards")
    @Timed
    public ResponseEntity<List<DashboardDTO>> searchDashboards(@RequestParam String query, Pageable pageable) {
        log.debug("REST request to search for a page of Dashboards for query {}", query);
        Page<Dashboard> page = dashboardSearchRepository.search(queryStringQuery(query), pageable);
        HttpHeaders headers = PaginationUtil.generateSearchPaginationHttpHeaders(query, page, "/api/_search/dashboards");
        return new ResponseEntity<>(dashboardMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }


    /**
     * Utility method that verifies if the requested widget is visible to the current user
     *
     * @param id
     * @return
     */
    private Optional<Dashboard> getDashboardIfAllowed(Long id) {

        Dashboard dashboard = dashboardRepository.findOne(id);

        final Boolean isAllowed = Optional.ofNullable(dashboard)
                .map(d -> d.getWorkspace().getUser().getUser().getLogin())
                .map(o -> SecurityUtils.isAllowed(o))
                .orElse(false);

        if (isAllowed) return Optional.of(dashboard);

        return Optional.empty();

    }

}
