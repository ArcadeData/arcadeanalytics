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

import com.arcadeanalytics.repository.FileSystemRepository
import com.arcadeanalytics.service.MediaService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.core.io.ResourceLoader

@Configuration
class MediaLoaderConfiguration(private val mediaService: MediaService,
                               private val resourceLoader: ResourceLoader,
                               private val fileSystemRepository: FileSystemRepository,
                               private val env: Environment
) {


    @Bean
    fun mediaLoader(): MediaLoader {

        val mediaPath = env.getProperty("application.mediaPath")

        val mediaLoader = MediaLoader(mediaPath, resourceLoader)

        mediaLoader.loadImages(mediaService)

        return mediaLoader
    }



}
