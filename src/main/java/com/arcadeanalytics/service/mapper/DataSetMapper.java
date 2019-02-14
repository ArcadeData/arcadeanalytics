package com.arcadeanalytics.service.mapper;

import com.arcadeanalytics.domain.DataSet;
import com.arcadeanalytics.service.dto.DataSetDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity DataSet and its DTO DataSetDTO.
 */
@Mapper(componentModel = "spring", uses = {})
public interface DataSetMapper extends EntityMapper<DataSetDTO, DataSet> {


    @Mapping(target = "operations", ignore = true)
    @Mapping(target = "widget", ignore = true)
    DataSet toEntity(DataSetDTO dataSetDTO);

    default DataSet fromId(Long id) {
        if (id == null) {
            return null;
        }
        DataSet dataSet = new DataSet();
        dataSet.setId(id);
        return dataSet;
    }
}
