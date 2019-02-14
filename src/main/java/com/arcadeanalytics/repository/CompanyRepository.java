package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.Company;
import com.arcadeanalytics.domain.enumeration.ContractType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


/**
 * Spring Data JPA repository for the Company entity.
 */
@SuppressWarnings("unused")
@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Company findByContractType(ContractType type);
}
