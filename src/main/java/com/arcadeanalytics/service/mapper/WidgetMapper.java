package com.arcadeanalytics.service.mapper;

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
