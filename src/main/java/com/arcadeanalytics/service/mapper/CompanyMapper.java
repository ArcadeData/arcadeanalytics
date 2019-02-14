package com.arcadeanalytics.service.mapper;

import com.arcadeanalytics.domain.Company;
import com.arcadeanalytics.service.dto.CompanyDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity Company and its DTO CompanyDTO.
 */
@Mapper(componentModel = "spring", uses = {ContractMapper.class})
public interface CompanyMapper extends EntityMapper<CompanyDTO, Company> {

    @Mapping(source = "contract.id", target = "contractId")
    CompanyDTO toDto(Company company);

    @Mapping(target = "users", ignore = true)
    @Mapping(source = "contractId", target = "contract")
    Company toEntity(CompanyDTO companyDTO);

    default Company fromId(Long id) {
        if (id == null) {
            return null;
        }
        Company company = new Company();
        company.setId(id);
        return company;
    }
}
