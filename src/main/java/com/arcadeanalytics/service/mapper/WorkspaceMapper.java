package com.arcadeanalytics.service.mapper;

/*-
 * #%L
 * Arcade Analytics
 * %%
 * Copyright (C) 2018 - 2019 ArcadeAnalytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

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
