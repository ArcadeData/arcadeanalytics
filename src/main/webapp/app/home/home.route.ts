import { Route } from '@angular/router';
import { DenyAccessIfLoggedGuard } from '../shared';

import { HomeComponent } from './';

export const HOME_ROUTE: Route = {
    path: '',
    component: HomeComponent,
    data: {
        authorities: [],
        pageTitle: 'home.title'
    },
};
