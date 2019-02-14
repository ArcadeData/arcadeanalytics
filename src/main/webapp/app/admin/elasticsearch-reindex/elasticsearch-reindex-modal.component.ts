import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

import { ElasticsearchReindexService } from './elasticsearch-reindex.service';

@Component({
    selector: 'jhi-elasticsearch-reindex-modal',
    templateUrl: './elasticsearch-reindex-modal.component.html'
})
export class ElasticsearchReindexModalComponent {

    constructor(
        private elasticsearchReindexService: ElasticsearchReindexService,
        public activeModal: BsModalRef
    ) { }

    reindex() {
        this.elasticsearchReindexService.reindex().subscribe(() => this.activeModal.hide());
    }
}
