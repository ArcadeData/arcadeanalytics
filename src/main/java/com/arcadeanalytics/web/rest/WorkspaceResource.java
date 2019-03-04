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

import com.arcadeanalytics.domain.Workspace;
import com.arcadeanalytics.repository.ArcadeUserRepository;
import com.arcadeanalytics.repository.WorkspaceRepository;
import com.arcadeanalytics.repository.search.WorkspaceSearchRepository;
import com.arcadeanalytics.security.AuthoritiesConstants;
import com.arcadeanalytics.security.SecurityUtils;
import com.arcadeanalytics.service.dto.WorkspaceDTO;
import com.arcadeanalytics.service.mapper.WorkspaceMapper;
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
 * REST controller for managing Workspace.
 */
@RestController
@RequestMapping("/api")
public class WorkspaceResource {

    private static final String ENTITY_NAME = "workspace";
    private final Logger log = LoggerFactory.getLogger(WorkspaceResource.class);

    private final WorkspaceRepository workspaceRepository;

    private final WorkspaceMapper workspaceMapper;

    private final WorkspaceSearchRepository workspaceSearchRepository;

    private final ArcadeUserRepository arcadeUserRepository;

    public WorkspaceResource(WorkspaceRepository workspaceRepository,
                             WorkspaceMapper workspaceMapper,
                             WorkspaceSearchRepository workspaceSearchRepository,
                             ArcadeUserRepository arcadeUserRepository) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceMapper = workspaceMapper;
        this.workspaceSearchRepository = workspaceSearchRepository;
        this.arcadeUserRepository = arcadeUserRepository;
    }

    /**
     * POST  /workspaces : Create a new workspace.
     *
     * @param workspaceDTO the workspaceDTO to create
     * @return the ResponseEntity with status 201 (Created) and with body the new workspaceDTO, or with status 400 (Bad Request) if the workspace has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/workspaces")
    @Timed
    public ResponseEntity<WorkspaceDTO> createWorkspace(@Valid @RequestBody WorkspaceDTO workspaceDTO) throws URISyntaxException {
        log.debug("REST request to save Workspace : {}", workspaceDTO);
        if (workspaceDTO.getId() != null) {
            throw new BadRequestAlertException("A new workspace cannot already have an ID", ENTITY_NAME, "idexists");
        }

        final List<Workspace> workspaces = workspaceRepository.findByUserIsCurrentUser();

        //TODO: encapsulate somewhere, this train wreck sucks too much
        int maxWorkspaces = arcadeUserRepository.findByUserLogin(SecurityUtils.getCurrentUserLogin().get())
                .get().getCompany().getContract().getMaxWorkspaces();
        if (workspaces.size() == maxWorkspaces) {
            throw new InternalServerErrorException("No more dashboard can be created, max number is: " + maxWorkspaces);
        }

        Workspace workspace = workspaceMapper.toEntity(workspaceDTO);
        workspace = workspaceRepository.save(workspace);
        WorkspaceDTO result = workspaceMapper.toDto(workspace);
        workspaceSearchRepository.save(workspace);
        return ResponseEntity.created(new URI("/api/workspaces/" + result.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
                .body(result);
    }

    /**
     * PUT  /workspaces : Updates an existing workspace.
     *
     * @param workspaceDTO the workspaceDTO to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated workspaceDTO,
     * or with status 400 (Bad Request) if the workspaceDTO is not valid,
     * or with status 500 (Internal Server Error) if the workspaceDTO couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/workspaces")
    @Timed
    public ResponseEntity<WorkspaceDTO> updateWorkspace(@Valid @RequestBody WorkspaceDTO workspaceDTO) throws URISyntaxException {
        log.debug("REST request to update Workspace : {}", workspaceDTO);
        if (workspaceDTO.getId() == null) {
            return createWorkspace(workspaceDTO);
        }
        Workspace workspace = workspaceMapper.toEntity(workspaceDTO);
        workspace = workspaceRepository.save(workspace);
        WorkspaceDTO result = workspaceMapper.toDto(workspace);
        workspaceSearchRepository.save(workspace);
        return ResponseEntity.ok()
                .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, workspaceDTO.getId().toString()))
                .body(result);
    }

    /**
     * GET  /workspaces : get all the workspaces.
     *
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of workspaces in body
     */
    @GetMapping("/workspaces")
    @Timed
    public ResponseEntity<List<WorkspaceDTO>> getAllWorkspaces(Pageable pageable) {
        log.debug("REST request to get a page of Workspaces");

        Page<Workspace> page;
        if (SecurityUtils.isCurrentUserInRole(AuthoritiesConstants.ADMIN)) {
            page = workspaceRepository.findAll(pageable);
        } else {
            page = workspaceRepository.findByUserIsCurrentUser(pageable);
        }

        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/workspaces");
        return new ResponseEntity<>(workspaceMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

    /**
     * GET  /workspaces/:id : get the "id" workspace.
     *
     * @param id the id of the workspaceDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the workspaceDTO, or with status 404 (Not Found)
     */
    @GetMapping("/workspaces/{id}")
    @Timed
    public ResponseEntity<WorkspaceDTO> getWorkspace(@PathVariable Long id) {
        log.debug("REST request to get Workspace : {}", id);
        Workspace workspace = workspaceRepository.findOne(id);
        WorkspaceDTO workspaceDTO = workspaceMapper.toDto(workspace);
        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(workspaceDTO));
    }

    /**
     * DELETE  /workspaces/:id : delete the "id" workspace.
     *
     * @param id the id of the workspaceDTO to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/workspaces/{id}")
    @Timed
    public ResponseEntity<Void> deleteWorkspace(@PathVariable Long id) {
        log.debug("REST request to delete Workspace : {}", id);
        workspaceRepository.delete(id);
        workspaceSearchRepository.delete(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }

    /**
     * SEARCH  /_search/workspaces?query=:query : search for the workspace corresponding
     * to the query.
     *
     * @param query    the query of the workspace search
     * @param pageable the pagination information
     * @return the result of the search
     */
    @GetMapping("/_search/workspaces")
    @Timed
    public ResponseEntity<List<WorkspaceDTO>> searchWorkspaces(@RequestParam String query, Pageable pageable) {
        log.debug("REST request to search for a page of Workspaces for query {}", query);
        Page<Workspace> page = workspaceSearchRepository.search(queryStringQuery(query), pageable);
        HttpHeaders headers = PaginationUtil.generateSearchPaginationHttpHeaders(query, page, "/api/_search/workspaces");
        return new ResponseEntity<>(workspaceMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

}
