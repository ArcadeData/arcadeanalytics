package com.arcadeanalytics.web.rest;

import com.arcadeanalytics.domain.ArcadeUser;
import com.arcadeanalytics.repository.ArcadeUserRepository;
import com.arcadeanalytics.repository.search.ArcadeUserSearchRepository;
import com.arcadeanalytics.service.dto.ArcadeUserDTO;
import com.arcadeanalytics.service.mapper.ArcadeUserMapper;
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
 * REST controller for managing ArcadeUser.
 */
@RestController
@RequestMapping("/api")
public class ArcadeUserResource {

    private static final String ENTITY_NAME = "arcadeUser";
    private final Logger log = LoggerFactory.getLogger(ArcadeUserResource.class);
    private final ArcadeUserRepository arcadeUserRepository;

    private final ArcadeUserMapper arcadeUserMapper;

    private final ArcadeUserSearchRepository arcadeUserSearchRepository;

    public ArcadeUserResource(ArcadeUserRepository arcadeUserRepository, ArcadeUserMapper arcadeUserMapper, ArcadeUserSearchRepository arcadeUserSearchRepository) {
        this.arcadeUserRepository = arcadeUserRepository;
        this.arcadeUserMapper = arcadeUserMapper;
        this.arcadeUserSearchRepository = arcadeUserSearchRepository;
    }

    /**
     * POST  /arcade-users : Create a new arcadeUser.
     *
     * @param arcadeUserDTO the arcadeUserDTO to create
     * @return the ResponseEntity with status 201 (Created) and with body the new arcadeUserDTO, or with status 400 (Bad Request) if the arcadeUser has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/arcade-users")
    @Timed
    public ResponseEntity<ArcadeUserDTO> createArcadeUser(@RequestBody ArcadeUserDTO arcadeUserDTO) throws URISyntaxException {
        log.debug("REST request to save ArcadeUser : {}", arcadeUserDTO);
        if (arcadeUserDTO.getId() != null) {
            throw new BadRequestAlertException("A new arcadeUser cannot already have an ID", ENTITY_NAME, "idexists");
        }
        ArcadeUser arcadeUser = arcadeUserMapper.toEntity(arcadeUserDTO);
        arcadeUser = arcadeUserRepository.save(arcadeUser);
        ArcadeUserDTO result = arcadeUserMapper.toDto(arcadeUser);
        arcadeUserSearchRepository.save(arcadeUser);
        return ResponseEntity.created(new URI("/api/arcade-users/" + result.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
                .body(result);
    }

    /**
     * PUT  /arcade-users : Updates an existing arcadeUser.
     *
     * @param arcadeUserDTO the arcadeUserDTO to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated arcadeUserDTO,
     * or with status 400 (Bad Request) if the arcadeUserDTO is not valid,
     * or with status 500 (Internal Server Error) if the arcadeUserDTO couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/arcade-users")
    @Timed
    public ResponseEntity<ArcadeUserDTO> updateArcadeUser(@RequestBody ArcadeUserDTO arcadeUserDTO) throws URISyntaxException {
        log.debug("REST request to update ArcadeUser : {}", arcadeUserDTO);
        if (arcadeUserDTO.getId() == null) {
            return createArcadeUser(arcadeUserDTO);
        }
        ArcadeUser arcadeUser = arcadeUserMapper.toEntity(arcadeUserDTO);
        arcadeUser = arcadeUserRepository.save(arcadeUser);
        ArcadeUserDTO result = arcadeUserMapper.toDto(arcadeUser);
        arcadeUserSearchRepository.save(arcadeUser);
        return ResponseEntity.ok()
                .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, arcadeUserDTO.getId().toString()))
                .body(result);
    }

    /**
     * GET  /arcade-users : get all the arcadeUsers.
     *
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of arcadeUsers in body
     */
    @GetMapping("/arcade-users")
    @Timed
    public ResponseEntity<List<ArcadeUserDTO>> getAllArcadeUsers(Pageable pageable) {
        log.debug("REST request to get a page of ArcadeUsers");
        Page<ArcadeUser> page = arcadeUserRepository.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/arcade-users");
        return new ResponseEntity<>(arcadeUserMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

    /**
     * GET  /arcade-users/:id : get the "id" arcadeUser.
     *
     * @param id the id of the arcadeUserDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the arcadeUserDTO, or with status 404 (Not Found)
     */
    @GetMapping("/arcade-users/{id}")
    @Timed
    public ResponseEntity<ArcadeUserDTO> getArcadeUser(@PathVariable Long id) {
        log.debug("REST request to get ArcadeUser : {}", id);
        ArcadeUser arcadeUser = arcadeUserRepository.findOne(id);
        ArcadeUserDTO arcadeUserDTO = arcadeUserMapper.toDto(arcadeUser);
        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(arcadeUserDTO));
    }

    /**
     * DELETE  /arcade-users/:id : delete the "id" arcadeUser.
     *
     * @param id the id of the arcadeUserDTO to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/arcade-users/{id}")
    @Timed
    public ResponseEntity<Void> deleteArcadeUser(@PathVariable Long id) {
        log.debug("REST request to delete ArcadeUser : {}", id);
        arcadeUserRepository.delete(id);
        arcadeUserSearchRepository.delete(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }

    /**
     * SEARCH  /_search/arcade-users?query=:query : search for the arcadeUser corresponding
     * to the query.
     *
     * @param query    the query of the arcadeUser search
     * @param pageable the pagination information
     * @return the result of the search
     */
    @GetMapping("/_search/arcade-users")
    @Timed
    public ResponseEntity<List<ArcadeUserDTO>> searchArcadeUsers(@RequestParam String query, Pageable pageable) {
        log.debug("REST request to search for a page of ArcadeUsers for query {}", query);
        Page<ArcadeUser> page = arcadeUserSearchRepository.search(queryStringQuery(query), pageable);
        HttpHeaders headers = PaginationUtil.generateSearchPaginationHttpHeaders(query, page, "/api/_search/arcade-users");
        return new ResponseEntity<>(arcadeUserMapper.toDto(page.getContent()), headers, HttpStatus.OK);
    }

}
