/*-
 * #%L
 * Arcade Analytics
 * %%
 * Copyright (C) 2018 - 2019 ArcadeAnalytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRouteSnapshot, NavigationEnd } from '@angular/router';

import { JhiLanguageHelper } from '../../shared';
import { pageContentPadding, pageBottomPaddingForEmbeddingResource as pageBottomPaddingForEmbeddedResource } from '../../global';

import * as jquery from 'jquery';
import * as cytoscape from 'cytoscape';
import * as panzoom from 'cytoscape-panzoom';
import * as cola from 'cytoscape-cola';
import * as dagre from 'cytoscape-dagre';
import * as cyqtip from 'cytoscape-qtip';
import * as cxtmenu from 'cytoscape-context-menus';
import * as cyCanvas from 'cytoscape-canvas';
import * as cyEdgehandles from 'cytoscape-edgehandles';

@Component({
    selector: 'jhi-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class JhiMainComponent implements OnInit {

    padding = pageContentPadding;
    bottomPadding = pageContentPadding;
    embeddedWidget: boolean = false;
    embeddedDashboard: boolean = false;

    constructor(
        private jhiLanguageHelper: JhiLanguageHelper,
        private router: Router
    ) {}

    private getPageTitle(routeSnapshot: ActivatedRouteSnapshot) {
        let title: string = (routeSnapshot.data && routeSnapshot.data['pageTitle']) ? routeSnapshot.data['pageTitle'] : 'arcadeanalyticsApp';
        if (routeSnapshot.firstChild) {
            title = this.getPageTitle(routeSnapshot.firstChild) || title;
        }
        return title;
    }

    ngOnInit() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {

                this.jhiLanguageHelper.updateTitle(this.getPageTitle(this.router.routerState.snapshot.root));

                // hide navbar and footer if the url corresponds to a shared resource
                if (this.router.routerState.snapshot.url.indexOf('embed/widget/') > 0) {
                    this.embeddedWidget = true;
                    this.embeddedDashboard = false;
                    this.bottomPadding = pageBottomPaddingForEmbeddedResource;     // overwriting default value
                } else if (this.router.routerState.snapshot.url.indexOf('embed/dashboard/') > 0) {
                    this.embeddedWidget = false;
                    this.embeddedDashboard = true;
                    this.bottomPadding = pageBottomPaddingForEmbeddedResource;     // overwriting default value
                } else {
                    this.embeddedWidget = false;
                    this.embeddedDashboard = false;
                }
            }
        });

        // registering cytoscape extensions just once when the app is initialized
        panzoom(cytoscape);
        cola(cytoscape);
        dagre(cytoscape);
        cyqtip(cytoscape);
        cxtmenu(cytoscape, jquery);
        cyCanvas(cytoscape);
        cytoscape.use(cyEdgehandles);
    }
}
