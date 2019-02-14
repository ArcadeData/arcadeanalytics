package com.arcadeanalytics.repository.search;

import com.arcadeanalytics.domain.Widget;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * Spring Data Elasticsearch repository for the Widget entity.
 */
public interface WidgetSearchRepository extends ElasticsearchRepository<Widget, Long> {
}
