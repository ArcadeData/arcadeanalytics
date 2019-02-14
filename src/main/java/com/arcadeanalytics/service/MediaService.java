package com.arcadeanalytics.service;

import com.arcadeanalytics.domain.Media;
import com.arcadeanalytics.repository.MediaRepository;
import com.arcadeanalytics.repository.UserRepository;
import com.arcadeanalytics.repository.search.MediaSearchRepository;
import com.arcadeanalytics.service.dto.MediaDTO;
import com.arcadeanalytics.service.mapper.MediaMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static org.elasticsearch.index.query.QueryBuilders.queryStringQuery;

/**
 * Service Implementation for managing Media.
 */
@Service
@Transactional
public class MediaService {

    private final Logger log = LoggerFactory.getLogger(MediaService.class);

    private final MediaRepository mediaRepository;

    private final MediaMapper mediaMapper;

    private final MediaSearchRepository mediaSearchRepository;

    private final UserRepository userRepository;

    public MediaService(MediaRepository mediaRepository,
                        MediaMapper mediaMapper,
                        MediaSearchRepository mediaSearchRepository,
                        UserRepository userRepository) {
        this.mediaRepository = mediaRepository;
        this.mediaMapper = mediaMapper;
        this.mediaSearchRepository = mediaSearchRepository;
        this.userRepository = userRepository;
    }

    /**
     * Save a media.
     *
     * @param mediaDTO the entity to save
     * @return the persisted entity
     */
    public MediaDTO save(MediaDTO mediaDTO) {
        log.info("storing media:: {} ", mediaDTO);
        Media media = mediaMapper.toEntity(mediaDTO);

        media = mediaRepository.save(media);
        MediaDTO result = mediaMapper.toDto(media);
        mediaSearchRepository.save(media);
        return result;
    }

    /**
     * Get all the media.
     *
     * @param pageable the pagination information
     * @return the list of entities
     */
    @Transactional(readOnly = true)
    public Page<MediaDTO> findAll(Pageable pageable) {
        log.debug("Request to get all Media");
        return mediaRepository.findAll(pageable)
                .map(mediaMapper::toDto);
    }

    /**
     * Get one media by id.
     *
     * @param id the id of the entity
     * @return the entity
     */
    @Transactional(readOnly = true)
    public MediaDTO findOne(Long id) {
        log.debug("Request to get Media : {}", id);
        Media media = mediaRepository.findOne(id);
        return mediaMapper.toDto(media);
    }

    /**
     * Delete the media by id.
     *
     * @param id the id of the entity
     */
    public void delete(Long id) {
        log.debug("Request to delete Media : {}", id);
        mediaRepository.delete(id);
        mediaSearchRepository.delete(id);
    }

    /**
     * Search for the media corresponding to the query.
     *
     * @param query    the query of the search
     * @param pageable the pagination information
     * @return the list of entities
     */
    @Transactional(readOnly = true)
    public Page<MediaDTO> search(String query, Pageable pageable) {
        log.debug("Request to search for a page of Media for query {}", query);
        Page<Media> result = mediaSearchRepository.search(queryStringQuery(query), pageable);
        return result.map(mediaMapper::toDto);
    }
}
