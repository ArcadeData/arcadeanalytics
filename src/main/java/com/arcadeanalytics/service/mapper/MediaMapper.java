package com.arcadeanalytics.service.mapper;

import com.arcadeanalytics.domain.Media;
import com.arcadeanalytics.service.dto.MediaDTO;
import org.mapstruct.Mapper;

/**
 * Mapper for the entity Media and its DTO MediaDTO.
 */
@Mapper(componentModel = "spring", uses = {})
public interface MediaMapper extends EntityMapper<MediaDTO, Media> {


    //    @Mapping(target = "file", ignore = true)
    MediaDTO toDto(Media media);

    //    @Mapping(source = "file", ignore = true)
    Media toEntity(MediaDTO mediaDTO);


    default Media fromId(Long id) {
        if (id == null) {
            return null;
        }
        Media media = new Media();
        media.setId(id);
        return media;
    }
}
