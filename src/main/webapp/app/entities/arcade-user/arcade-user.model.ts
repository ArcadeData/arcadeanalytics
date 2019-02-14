import { BaseEntity } from './../../shared';

export class ArcadeUser implements BaseEntity {
    constructor(
        public id?: number,
        public userId?: number,
        public workspaces?: BaseEntity[],
        public companyId?: number,
    ) {
    }
}
