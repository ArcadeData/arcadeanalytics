package com.arcadeanalytics.util

import com.arcadeanalytics.ArcadeanalyticsApp
import com.arcadeanalytics.repository.MediaRepository
import com.arcadeanalytics.service.MediaService
import org.assertj.core.api.Assertions
import org.junit.Test
import org.junit.runner.RunWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner


@RunWith(SpringJUnit4ClassRunner::class)
@SpringBootTest(classes = arrayOf(ArcadeanalyticsApp::class))
class MediaLoaderIntTest {

    @Autowired
    private lateinit var mediaRepository: MediaRepository

    @Autowired
    private lateinit var mediaService: MediaService

    @Autowired
    private lateinit var mediaLoader: MediaLoader

    @Test
    fun shouldLoadAllImagesFromDirectories() {

        val initialSize = mediaRepository.findAll().size

        mediaLoader.loadImages(mediaService)

        Assertions.assertThat(mediaRepository.findAll().size)
            .isGreaterThanOrEqualTo(initialSize)
    }
}
