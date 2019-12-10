package com.arcadeanalytics.service.util;

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

import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.provider.DataSourceInfo;

import java.util.Optional;

public class DataSourceUtil {

    public static DataSourceInfo toDataSourceInfo(DataSource ds) {

        return new DataSourceInfo(Optional.ofNullable(ds.getId()).orElse(-1L),
                ds.getType().name(),
                ds.getName(),
                ds.getDescription(),
                ds.getServer(),
                ds.getPort(),
                Optional.ofNullable(ds.getDatabase()).orElse(""),
                Optional.ofNullable(ds.getUsername()).orElse(""),
                Optional.ofNullable(ds.getPassword()).orElse(""),
                Optional.ofNullable(ds.isAggregationEnabled()).orElse(false),
                Optional.ofNullable(ds.getConnectionProperties()).orElse("{}"),
                Optional.ofNullable(ds.isRemote()).orElse(false),
                Optional.ofNullable(ds.getGateway()).orElse(""),
                Optional.ofNullable(ds.getSshPort()).orElse(1234),
                Optional.ofNullable(ds.getSshUser()).orElse("")
        );
    }
}
