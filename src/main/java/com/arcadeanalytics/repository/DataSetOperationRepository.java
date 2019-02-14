package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.DataSetOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


/**
 * Spring Data JPA repository for the DataSetOperation entity.
 */
@SuppressWarnings("unused")
@Repository
public interface DataSetOperationRepository extends JpaRepository<DataSetOperation, Long> {

}
