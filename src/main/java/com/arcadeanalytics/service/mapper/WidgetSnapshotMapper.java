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

import com.arcadeanalytics.domain.WidgetSnapshot;
import com.arcadeanalytics.service.dto.WidgetSnapshotDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity WidgetSnapshot and its DTO WidgetSnapshotDTO.
 */
@Mapper(componentModel = "spring", uses = {WidgetMapper.class})
public interface WidgetSnapshotMapper extends EntityMapper<WidgetSnapshotDTO, WidgetSnapshot> {

    @Mapping(source = "widget.id", target = "widgetId")
    WidgetSnapshotDTO toDto(WidgetSnapshot widgetSnapshot);

    @Mapping(source = "widgetId", target = "widget")
    WidgetSnapshot toEntity(WidgetSnapshotDTO widgetSnapshotDTO);

    default WidgetSnapshot fromId(Long id) {
        if (id == null) {
            return null;
        }
        WidgetSnapshot widgetSnapshot = new WidgetSnapshot();
        widgetSnapshot.setId(id);
        return widgetSnapshot;
    }
}
