import { BaseEntity } from './../../shared';

export class DataSet implements BaseEntity {
    constructor(
        public id?: number,
        public name?: string,
        public description?: string,
        public query?: string,
        public limit?: number,
        public skipEdgesNotInDataset?: boolean,
        public skipIsolatedVertices?: boolean,
        public dashboardId?: number,
        public datasourceId?: number,
    ) {
        this.skipEdgesNotInDataset = false;
        this.skipIsolatedVertices = false;
    }
}
