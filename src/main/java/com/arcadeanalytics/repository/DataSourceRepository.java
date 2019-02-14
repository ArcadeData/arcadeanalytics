package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


/**
 * Spring Data JPA repository for the DataSource entity.
 */
@SuppressWarnings("unused")
@Repository
public interface DataSourceRepository extends JpaRepository<DataSource, Long> {

    Page<DataSource> findByWorkspaceUserUserLogin(String currentUserLogin, Pageable pageable);

    List<DataSource> findByWorkspaceUserUserLogin(String currentUserLogin);

    List<DataSource> findByWorkspace(Workspace workspace);

}
