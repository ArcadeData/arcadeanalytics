package com.arcadeanalytics.service.mapper;

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
