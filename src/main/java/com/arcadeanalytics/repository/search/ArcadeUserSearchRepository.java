package com.arcadeanalytics.repository.search;

import com.arcadeanalytics.domain.ArcadeUser;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * Spring Data Elasticsearch repository for the ArcadeUser entity.
 */
public interface ArcadeUserSearchRepository extends ElasticsearchRepository<ArcadeUser, Long> {
}
