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

import com.arcadeanalytics.domain.DataSourceIndex;
import com.arcadeanalytics.service.dto.DataSourceIndexDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity DataSourceIndex and its DTO DataSourceIndexDTO.
 */
@Mapper(componentModel = "spring", uses = {DataSourceMapper.class})
public interface DataSourceIndexMapper extends EntityMapper<DataSourceIndexDTO, DataSourceIndex> {

    @Mapping(source = "dataSource.id", target = "dataSourceId")
    DataSourceIndexDTO toDto(DataSourceIndex dataSourceIndex);

    @Mapping(source = "dataSourceId", target = "dataSource")
    DataSourceIndex toEntity(DataSourceIndexDTO dataSourceIndexDTO);

    default DataSourceIndex fromId(Long id) {
        if (id == null) {
            return null;
        }
        DataSourceIndex dataSourceIndex = new DataSourceIndex();
        dataSourceIndex.setId(id);
        return dataSourceIndex;
    }
}
