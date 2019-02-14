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
