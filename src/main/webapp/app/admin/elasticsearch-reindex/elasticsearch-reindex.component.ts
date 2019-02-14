import { Component, OnInit } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap';

import { ElasticsearchReindexModalComponent } from './elasticsearch-reindex-modal.component';

@Component({
    selector: 'jhi-elasticsearch-reindex',
    templateUrl: './elasticsearch-reindex.component.html'
})
export class ElasticsearchReindexComponent {

    constructor(
        private modalService: BsModalService
    ) { }

    showConfirm() {
        this.modalService.show(ElasticsearchReindexModalComponent);
    }
}
