package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.Dashboard;
import com.arcadeanalytics.domain.Widget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


/**
 * Spring Data JPA repository for the Widget entity.
 */
@SuppressWarnings("unused")
@Repository
public interface WidgetRepository extends JpaRepository<Widget, Long> {


    Page<Widget> findByDashboardWorkspaceUserUserLogin(String currentUserLogin, Pageable pageable);

    List<Widget> findByDashboardWorkspaceUserUserLogin(String currentUserLogin);

    Page<Widget> findByDashboardId(Long dashboardId, Pageable pageable);

    List<Widget> findByDashboard(Dashboard dashboard);

    Optional<Widget> findOneByUuid(UUID uuid);

}
