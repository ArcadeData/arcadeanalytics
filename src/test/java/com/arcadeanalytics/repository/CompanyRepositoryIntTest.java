package com.arcadeanalytics.repository;


import com.arcadeanalytics.ArcadeanalyticsApp;
import com.arcadeanalytics.domain.Company;
import com.arcadeanalytics.domain.Contract;
import com.arcadeanalytics.domain.enumeration.ContractType;
import com.arcadeanalytics.web.rest.CompanyResourceIntTest;
import org.assertj.core.api.Assertions;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
@Transactional
public class CompanyRepositoryIntTest {


    @Autowired
    public CompanyRepository companyRepository;

    @Autowired
    private EntityManager em;

    @Before
    public void setUp() throws Exception {
        final Company company = CompanyResourceIntTest.createEntity(em);

        Contract contract = new Contract()
            .type(ContractType.FREE)
            .name("FREE");

        em.persist(contract);
        company.setContract(contract);
        em.persist(company);
    }

    @Test
    public void testFindByContractType() {


        final Company company = companyRepository.findByContractType(ContractType.FREE);

        Assertions.assertThat(company.getContract().getType()).isEqualTo(ContractType.FREE);


    }
}
