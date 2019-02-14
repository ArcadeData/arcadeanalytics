package com.arcadeanalytics.repository.search;

import com.arcadeanalytics.domain.WidgetSnapshot;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * Spring Data Elasticsearch repository for the WidgetSnapshot entity.
 */
public interface WidgetSnapshotSearchRepository extends ElasticsearchRepository<WidgetSnapshot, Long> {
}
