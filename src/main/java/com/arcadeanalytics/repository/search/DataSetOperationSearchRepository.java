package com.arcadeanalytics.repository.search;

import com.arcadeanalytics.domain.DataSetOperation;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * Spring Data Elasticsearch repository for the DataSetOperation entity.
 */
public interface DataSetOperationSearchRepository extends ElasticsearchRepository<DataSetOperation, Long> {
}
