import { BaseEntity } from './../../shared';

export const enum ContractType {
    'FREE',
    'SILVER',
    'GOLD',
    'CUSTOM'
}

export class Contract implements BaseEntity {
    constructor(
        public id?: number,
        public name?: string,
        public description?: string,
        public type?: ContractType,
        public maxWorkspaces?: number,
        public maxDashboards?: number,
        public maxWidgets?: number,
        public maxElements?: number,
        public maxTraversal?: number,
        public maxPower?: number,
        public ha?: boolean,
        public pollingInterval?: number,
    ) {
        this.ha = false;
    }
}
