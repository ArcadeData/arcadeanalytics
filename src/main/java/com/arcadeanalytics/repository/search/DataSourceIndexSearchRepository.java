package com.arcadeanalytics.repository.search;

import com.arcadeanalytics.domain.DataSourceIndex;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * Spring Data Elasticsearch repository for the DataSourceIndex entity.
 */
public interface DataSourceIndexSearchRepository extends ElasticsearchRepository<DataSourceIndex, Long> {
}
