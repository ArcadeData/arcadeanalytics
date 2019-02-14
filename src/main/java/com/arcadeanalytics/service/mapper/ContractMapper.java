package com.arcadeanalytics.service.mapper;

import com.arcadeanalytics.domain.Contract;
import com.arcadeanalytics.service.dto.ContractDTO;
import org.mapstruct.Mapper;

/**
 * Mapper for the entity Contract and its DTO ContractDTO.
 */
@Mapper(componentModel = "spring", uses = {})
public interface ContractMapper extends EntityMapper<ContractDTO, Contract> {


    default Contract fromId(Long id) {
        if (id == null) {
            return null;
        }
        Contract contract = new Contract();
        contract.setId(id);
        return contract;
    }
}
