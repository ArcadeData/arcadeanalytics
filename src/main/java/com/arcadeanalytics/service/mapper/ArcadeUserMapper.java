package com.arcadeanalytics.service.mapper;

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

import com.arcadeanalytics.domain.ArcadeUser;
import com.arcadeanalytics.service.dto.ArcadeUserDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for the entity ArcadeUser and its DTO ArcadeUserDTO.
 */
@Mapper(componentModel = "spring", uses = {UserMapper.class, CompanyMapper.class})
public interface ArcadeUserMapper extends EntityMapper<ArcadeUserDTO, ArcadeUser> {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "company.id", target = "companyId")
    ArcadeUserDTO toDto(ArcadeUser arcadeUser);

    @Mapping(source = "userId", target = "user")
    @Mapping(target = "workspaces", ignore = true)
    @Mapping(source = "companyId", target = "company")
    ArcadeUser toEntity(ArcadeUserDTO arcadeUserDTO);

    default ArcadeUser fromId(Long id) {
        if (id == null) {
            return null;
        }
        ArcadeUser arcadeUser = new ArcadeUser();
        arcadeUser.setId(id);
        return arcadeUser;
    }
}
