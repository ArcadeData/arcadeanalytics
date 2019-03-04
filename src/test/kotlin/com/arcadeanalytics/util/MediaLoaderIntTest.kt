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
