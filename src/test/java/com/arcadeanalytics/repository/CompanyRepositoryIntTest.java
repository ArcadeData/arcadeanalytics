package com.arcadeanalytics.repository;

/*-
 * #%L
 * Arcade Analytics
 * %%
 * Copyright (C) 2018 - 2019 ArcadeAnalytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */


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
