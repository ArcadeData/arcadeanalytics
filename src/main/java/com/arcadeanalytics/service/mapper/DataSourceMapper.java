package com.arcadeanalytics.service.mapper;

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
