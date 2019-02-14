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
