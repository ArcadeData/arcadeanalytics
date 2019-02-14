package com.arcadeanalytics.repository.search;

import com.arcadeanalytics.domain.DataSource;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * Spring Data Elasticsearch repository for the DataSource entity.
 */
public interface DataSourceSearchRepository extends ElasticsearchRepository<DataSource, Long> {
}
