import { BaseEntity } from './../../shared';

export class Workspace implements BaseEntity {
    constructor(
        public id?: number,
        public name?: string,
        public description?: string,
        public dashboards?: BaseEntity[],
        public datasources?: BaseEntity[],
        public userId?: number,
    ) {
    }
}
