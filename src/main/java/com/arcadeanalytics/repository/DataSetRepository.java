package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.DataSet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


/**
 * Spring Data JPA repository for the DataSet entity.
 */
@SuppressWarnings("unused")
@Repository
public interface DataSetRepository extends JpaRepository<DataSet, Long> {

    Page<DataSet> findByWidgetDashboardWorkspaceUserUserLogin(String currentUserLogin, Pageable pageable);

    List<DataSet> findByWidgetDashboardWorkspaceUserUserLogin(String currentUserLogin);

}
