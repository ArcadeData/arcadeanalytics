import { ITEMS_PER_PAGE } from '../../shared';
import { Injectable } from '@angular/core';
import { PaginationConfig } from 'ngx-bootstrap';

@Injectable({ providedIn: 'root' })
export class PaginationConfiguration {
    constructor(private config: PaginationConfig) {
        config.main.boundaryLinks = true;
        config.main.maxSize = 5;
        config.main.itemsPerPage = ITEMS_PER_PAGE;
    }
}
