package com.arcadeanalytics.service.mapper;

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
