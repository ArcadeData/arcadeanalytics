package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.DataSourceIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


/**
 * Spring Data JPA repository for the DataSourceIndex entity.
 */
@SuppressWarnings("unused")
@Repository
public interface DataSourceIndexRepository extends JpaRepository<DataSourceIndex, Long> {

}
