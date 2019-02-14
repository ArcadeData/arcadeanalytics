package com.arcadeanalytics.service.mapper;

import com.arcadeanalytics.domain.Workspace;
import com.arcadeanalytics.service.dto.WorkspaceDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity Workspace and its DTO WorkspaceDTO.
 */
@Mapper(componentModel = "spring", uses = {ArcadeUserMapper.class})
public interface WorkspaceMapper extends EntityMapper<WorkspaceDTO, Workspace> {

    @Mapping(source = "user.id", target = "userId")
    WorkspaceDTO toDto(Workspace workspace);

    @Mapping(target = "dashboards", ignore = true)
    @Mapping(target = "dataSources", ignore = true)
    @Mapping(source = "userId", target = "user")
    Workspace toEntity(WorkspaceDTO workspaceDTO);

    default Workspace fromId(Long id) {
        if (id == null) {
            return null;
        }
        Workspace workspace = new Workspace();
        workspace.setId(id);
        return workspace;
    }
}
