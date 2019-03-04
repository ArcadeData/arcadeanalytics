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

import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.service.dto.DataSourceDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity DataSource and its DTO DataSourceDTO.
 */
@Mapper(componentModel = "spring", uses = {WorkspaceMapper.class})
public interface DataSourceMapper extends EntityMapper<DataSourceDTO, DataSource> {

    @Mapping(source = "workspace.id", target = "workspaceId")
    DataSourceDTO toDto(DataSource dataSource);

    @Mapping(target = "dataSourceIndices", ignore = true)
    @Mapping(source = "workspaceId", target = "workspace")
    DataSource toEntity(DataSourceDTO dataSourceDTO);

    default DataSource fromId(Long id) {
        if (id == null) {
            return null;
        }
        DataSource dataSource = new DataSource();
        dataSource.setId(id);
        return dataSource;
    }
}
