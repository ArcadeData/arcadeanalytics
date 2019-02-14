package com.arcadeanalytics.util

import com.arcadeanalytics.web.algorithms.ShortestPathInput
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions
import org.junit.Test
import java.io.File

class GraphDataDeserializerShould {


    @Test
    fun `deserialize graph data json`() {

        val mapper = ObjectMapper()


//        val module = SimpleModule()
//
//        module.addDeserializer(GraphData::class.java, GraphDataDeserializer())
//
//        mapper.registerModule(module)

        val json: String = File("./src/test/resources/InputGraphForAlgos.json").readText(Charsets.UTF_8)

        val graphData = mapper.readValue<ShortestPathInput>(json, ShortestPathInput::class.java)

        Assertions.assertThat(graphData.inputGraph.nodes).isNotEmpty


    }
}
