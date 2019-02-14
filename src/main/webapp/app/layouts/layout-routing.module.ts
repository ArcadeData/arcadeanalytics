import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArcadeanalyticsSharedModule, UserRouteAccessService } from '../shared';

import { navbarRoute } from '../app.route';
import { errorRoute } from './';

const LAYOUT_ROUTES = [
    navbarRoute,
    ...errorRoute
];

@NgModule({
    imports: [
        RouterModule.forRoot(LAYOUT_ROUTES, { useHash: true }),
        ArcadeanalyticsSharedModule
    ],
    exports: [
        RouterModule
    ]
})
export class LayoutRoutingModule {}
