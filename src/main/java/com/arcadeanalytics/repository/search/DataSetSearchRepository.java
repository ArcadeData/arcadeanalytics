package com.arcadeanalytics.repository.search;

import com.arcadeanalytics.domain.DataSet;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * Spring Data Elasticsearch repository for the DataSet entity.
 */
public interface DataSetSearchRepository extends ElasticsearchRepository<DataSet, Long> {
}
