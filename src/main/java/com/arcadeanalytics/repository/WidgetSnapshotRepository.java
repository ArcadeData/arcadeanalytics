package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.WidgetSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


/**
 * Spring Data JPA repository for the WidgetSnapshot entity.
 */
@SuppressWarnings("unused")
@Repository
public interface WidgetSnapshotRepository extends JpaRepository<WidgetSnapshot, Long> {

}
