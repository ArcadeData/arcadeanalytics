package com.arcadeanalytics.service.mapper;

import com.arcadeanalytics.domain.Dashboard;
import com.arcadeanalytics.service.dto.DashboardDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity Dashboard and its DTO DashboardDTO.
 */
@Mapper(componentModel = "spring", uses = {WorkspaceMapper.class})
public interface DashboardMapper extends EntityMapper<DashboardDTO, Dashboard> {

    @Mapping(source = "workspace.id", target = "workspaceId")
    @Mapping(source = "workspace.user.user.id", target = "userId")
    @Mapping(source = "workspace.user.user.login", target = "login")
    DashboardDTO toDto(Dashboard dashboard);

    @Mapping(target = "widgets", ignore = true)
    @Mapping(source = "workspaceId", target = "workspace")
//    @Mapping(source = "userId", ignore = true)
    Dashboard toEntity(DashboardDTO dashboardDTO);

    default Dashboard fromId(Long id) {
        if (id == null) {
            return null;
        }
        Dashboard dashboard = new Dashboard();
        dashboard.setId(id);
        return dashboard;
    }
}
