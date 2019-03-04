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

import com.arcadeanalytics.domain.Widget;
import com.arcadeanalytics.service.dto.WidgetDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity Widget and its DTO WidgetDTO.
 */
@Mapper(componentModel = "spring", uses = {DataSetMapper.class, DataSourceMapper.class, DashboardMapper.class})
public interface WidgetMapper extends EntityMapper<WidgetDTO, Widget> {

    @Mapping(source = "dataSet.id", target = "dataSetId")
    @Mapping(source = "dataSource.id", target = "dataSourceId")
    @Mapping(source = "dashboard.id", target = "dashboardId")
    WidgetDTO toDto(Widget widget);

    @Mapping(source = "dataSetId", target = "dataSet")
    @Mapping(target = "snapshots", ignore = true)
    @Mapping(source = "dataSourceId", target = "dataSource")
    @Mapping(source = "dashboardId", target = "dashboard")
    Widget toEntity(WidgetDTO widgetDTO);

    default Widget fromId(Long id) {
        if (id == null) {
            return null;
        }
        Widget widget = new Widget();
        widget.setId(id);
        return widget;
    }
}
