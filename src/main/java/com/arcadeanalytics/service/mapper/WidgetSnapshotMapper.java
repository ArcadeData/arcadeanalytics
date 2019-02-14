package com.arcadeanalytics.service.mapper;

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
