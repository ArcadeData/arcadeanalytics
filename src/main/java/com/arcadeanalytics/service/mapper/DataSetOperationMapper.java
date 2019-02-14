package com.arcadeanalytics.service.mapper;

import com.arcadeanalytics.domain.DataSetOperation;
import com.arcadeanalytics.service.dto.DataSetOperationDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity DataSetOperation and its DTO DataSetOperationDTO.
 */
@Mapper(componentModel = "spring", uses = {DataSetMapper.class})
public interface DataSetOperationMapper extends EntityMapper<DataSetOperationDTO, DataSetOperation> {

    @Mapping(source = "dataset.id", target = "datasetId")
    DataSetOperationDTO toDto(DataSetOperation dataSetOperation);

    @Mapping(source = "datasetId", target = "dataset")
    DataSetOperation toEntity(DataSetOperationDTO dataSetOperationDTO);

    default DataSetOperation fromId(Long id) {
        if (id == null) {
            return null;
        }
        DataSetOperation dataSetOperation = new DataSetOperation();
        dataSetOperation.setId(id);
        return dataSetOperation;
    }
}
