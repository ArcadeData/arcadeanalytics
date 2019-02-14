import { BaseEntity } from './../../shared';

export const enum MediaCategory {
    'BROWSERS',
    'BUILDINGS',
    'BUSINESS',
    'CHARACTERS',
    'COMMUNICATION',
    'ENTERTAINMENT',
    'GEO',
    'ICONS',
    'PEOPLE',
    'PICTURES',
    'SCIENCE',
    'TECHNOLOGY',
    'VEHICLES',
    'MISCELLANEOUS'
}

export class Media implements BaseEntity {
    constructor(
        public id?: number,
        public name?: string,
        public description?: string,
        public category?: MediaCategory,
        public fileContentType?: string,
        public file?: any,

    ) {
    }
}
