package com.arcadeanalytics.util

import com.arcadeanalytics.domain.enumeration.MediaCategory
import com.arcadeanalytics.service.MediaService
import com.arcadeanalytics.service.dto.MediaDTO
import org.slf4j.LoggerFactory
import org.springframework.core.io.ResourceLoader
import org.springframework.core.io.support.ResourcePatternUtils
import org.springframework.data.domain.PageRequest


class MediaLoader(private val mediaPath: String, private val resourceLoader: ResourceLoader) {

    private val log = LoggerFactory.getLogger(MediaLoader::class.java)

    fun loadImages(mediaService: MediaService) {

        log.info("start loading images from:: {} ", mediaPath)

        val resolver = ResourcePatternUtils.getResourcePatternResolver(resourceLoader)

        resolver.getResources("$mediaPath**/*.png")
            .asSequence()
            .map { f ->
                val media = MediaDTO()
                val cat = f.uri.toString()
                    .replaceBefore("media", "")
                    .removePrefix("media/")
                    .replaceAfterLast("/", "")
                    .replace("/", "")

                with(media) {
                    name = f.filename
                        .substringAfter("_")
                        .substringBefore(".")

                    description = f.filename
                        .substringAfter("_")
                        .replace("-", " ")
                        .replace("_", " ")

                    category = MediaCategory.valueOf(cat.toUpperCase())

                    fileContentType = "image/${f.filename.substringAfter(".")} "
                    file = f.inputStream.readBytes()
                }
                media
            }
            .filter { m -> mediaService.search("name:${m.name}", PageRequest(0, 10)).numberOfElements == 0 }
            .map { m -> mediaService.save(m) }
            .forEach { m -> log.info("stored :: ${m.id} - ${m.name}") }

        log.info("done loading images")
    }


}
