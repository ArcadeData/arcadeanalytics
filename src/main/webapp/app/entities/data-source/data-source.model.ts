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
import {BaseEntity} from './../../shared';

export const enum DataSourceType {
    'ORIENTDB',
    'ORIENTDB3',
    'GREMLIN_ORIENTDB',
    'GREMLIN_NEPTUNE',
    'GREMLIN_COSMOSDB',
    'GREMLIN_JANUSGRAPH',
    'NEO4J',
    'NEO4J_MEMGRAPH',
    'JANUSGRAPH',
    'TIGERGRAPH',
    'RDBMS_ORACLE',
    'RDBMS_MSSQLSERVER',
    'RDBMS_MYSQL',
    'RDBMS_POSTGRESQL',
    'RDBMS_HSQL',
    'RDBMS_DATA_WORLD',
    'RDF',
    'STARDOG',
    'ARANGO'
}

export const enum IndexingStatus {
    'NOT_INDEXED',
    'INDEXING',
    'INDEXED'
}

export class DataSource implements BaseEntity {
    constructor(
        public id?: number,
        public name?: string,
        public description?: string,
        public type?: DataSourceType,
        public indexing?: IndexingStatus,
        public server?: string,
        public port?: number,
        public database?: string,
        public connectionUrl?: string,
        public username?: string,
        public password?: string,
        public remote?: boolean,
        public gateway?: string,
        public sshUser?: string,
        public sshPort?: number,
        public skipSslValidation?: boolean,
        public enableSsl?: boolean,
        public dataSourceIndices?: BaseEntity[],
        public workspaceId?: number,
        public connectionProperties?: string,
        public aggregationEnabled?: boolean
    ) {
        this.remote = false;
        this.enableSsl = false;
        this.aggregationEnabled = false;
        this.skipSslValidation = false;
    }
}
