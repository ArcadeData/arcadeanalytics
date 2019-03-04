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
