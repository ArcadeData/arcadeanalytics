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
