import { BaseEntity } from './../../shared';

export class Company implements BaseEntity {
    constructor(
        public id?: number,
        public name?: string,
        public description?: string,
        public users?: BaseEntity[],
        public contractId?: number,
    ) {
    }
}
