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

import com.arcadeanalytics.repository.UserRepository;
import com.arcadeanalytics.service.MediaService;
import com.arcadeanalytics.service.dto.MediaDTO;
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

/**
 * REST controller for managing Media.
 */
@RestController
@RequestMapping("/api")
public class MediaResource {

    private static final String ENTITY_NAME = "media";
    private final Logger log = LoggerFactory.getLogger(MediaResource.class);

    private final MediaService mediaService;

    private final UserRepository userRepository;


    public MediaResource(MediaService mediaService, UserRepository userRepository) {
        this.mediaService = mediaService;
        this.userRepository = userRepository;
    }

    /**
     * POST  /media : Create a new media.
     *
     * @param mediaDTO the mediaDTO to create
     * @return the ResponseEntity with status 201 (Created) and with body the new mediaDTO, or with status 400 (Bad Request) if the media has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/media")
    @Timed
    public ResponseEntity<MediaDTO> createMedia(@Valid @RequestBody MediaDTO mediaDTO) throws URISyntaxException {
        log.debug("REST request to save Media : {}", mediaDTO);
        if (mediaDTO.getId() != null) {
            throw new BadRequestAlertException("A new media cannot already have an ID", ENTITY_NAME, "idexists");
        }


        MediaDTO result = mediaService.save(mediaDTO);

        return ResponseEntity.created(new URI("/api/media/" + result.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
                .body(result);
    }

    /**
     * PUT  /media : Updates an existing media.
     *
     * @param mediaDTO the mediaDTO to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated mediaDTO,
     * or with status 400 (Bad Request) if the mediaDTO is not valid,
     * or with status 500 (Internal Server Error) if the mediaDTO couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/media")
    @Timed
    public ResponseEntity<MediaDTO> updateMedia(@Valid @RequestBody MediaDTO mediaDTO) throws URISyntaxException {
        log.debug("REST request to update Media : {}", mediaDTO);
        if (mediaDTO.getId() == null) {
            return createMedia(mediaDTO);
        }
        MediaDTO result = mediaService.save(mediaDTO);
        return ResponseEntity.ok()
                .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, mediaDTO.getId().toString()))
                .body(result);
    }

    /**
     * GET  /media : get all the media.
     *
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of media in body
     */
    @GetMapping("/media")
    @Timed
    public ResponseEntity<List<MediaDTO>> getAllMedia(Pageable pageable) {
        log.debug("REST request to get a page of Media");
        Page<MediaDTO> page = mediaService.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/media");
        return new ResponseEntity<>(page.getContent(), headers, HttpStatus.OK);
    }

    /**
     * GET  /media/:id : get the "id" media.
     *
     * @param id the id of the mediaDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the mediaDTO, or with status 404 (Not Found)
     */
    @GetMapping("/media/{id}")
    @Timed
    public ResponseEntity<MediaDTO> getMedia(@PathVariable Long id) {
        log.debug("REST request to get Media : {}", id);
        MediaDTO mediaDTO = mediaService.findOne(id);
        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(mediaDTO));
    }

    /**
     * DELETE  /media/:id : delete the "id" media.
     *
     * @param id the id of the mediaDTO to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/media/{id}")
    @Timed
    public ResponseEntity<Void> deleteMedia(@PathVariable Long id) {
        log.debug("REST request to delete Media : {}", id);
        mediaService.delete(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }

    /**
     * SEARCH  /_search/media?query=:query : search for the media corresponding
     * to the query.
     *
     * @param query    the query of the media search
     * @param pageable the pagination information
     * @return the result of the search
     */
    @GetMapping("/_search/media")
    @Timed
    public ResponseEntity<List<MediaDTO>> searchMedia(@RequestParam String query, Pageable pageable) {
        log.debug("REST request to search for a page of Media for query {}", query);
        Page<MediaDTO> page = mediaService.search(query, pageable);
        HttpHeaders headers = PaginationUtil.generateSearchPaginationHttpHeaders(query, page, "/api/_search/media");
        return new ResponseEntity<>(page.getContent(), headers, HttpStatus.OK);
    }

}
