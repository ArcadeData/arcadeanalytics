import { BaseEntity } from './../../shared';

export const enum DataSourceType {
    'ORIENTDB',
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
        public dataSourceIndices?: BaseEntity[],
        public workspaceId?: number,
        public connectionProperties?: string,
        public aggregationEnabled?: boolean
    ) {
        this.remote = false;
        this.aggregationEnabled = false;
    }
}
