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
import com.arcadeanalytics.service.dto.MediaDTO
import org.junit.Test
import java.nio.file.Files
import java.nio.file.Paths

class PlaygroundTest {


    @Test
    fun testFiles() {


        Paths.get("./src/main/webapp/content/media/").toFile()
            .walkBottomUp()
            .filter { f -> f.isFile && f.extension.equals("png") }
            .map { f ->
                val media = MediaDTO()
                media.name = f.name
                media.category = MediaCategory.valueOf(f.parentFile.name.toUpperCase())
                media.file = f.readBytes()
                media
            }
            .forEach { m -> println("m = ${m}") }


        Paths.get("./src/main/webapp/content/media/").toFile()
            .walkBottomUp()
            .filter { f -> f.extension == "png" }



        Files.newDirectoryStream(Paths.get("./src/main/webapp/content/media/"), "**/*.png")
            .map { p -> println("p = ${p}") }

    }
}
