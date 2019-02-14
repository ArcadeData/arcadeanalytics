import { Route } from '@angular/router';
import { UserRouteAccessService } from '../../shared';
import { ElasticsearchReindexComponent } from './elasticsearch-reindex.component';

export const elasticsearchReindexRoute: Route = {
    path: 'elasticsearch-reindex',
    component: ElasticsearchReindexComponent,
    data: {
        authorities: ['ROLE_ADMIN'],
        pageTitle: 'elasticsearch.reindex.title'
    },
    canActivate: [UserRouteAccessService]
};
