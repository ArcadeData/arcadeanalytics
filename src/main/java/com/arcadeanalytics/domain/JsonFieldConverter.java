package com.arcadeanalytics.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;


@Converter(autoApply = true)
public class JsonFieldConverter implements AttributeConverter<Map<String, Object>, String> {


    @Override
    public String convertToDatabaseColumn(Map<String, Object> entityValue) {
        if (entityValue == null)
            return null;

        ObjectMapper mapper = new ObjectMapper();

        try {
            return mapper.writeValueAsString(entityValue);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }


        return "";
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(String databaseValue) {
        if (databaseValue == null)
            return null;

        ObjectMapper mapper = new ObjectMapper();

        try {
            return mapper.readValue(databaseValue, Map.class);
        } catch (IOException e) {
            e.printStackTrace();
        }

        return Collections.emptyMap();
    }
}
