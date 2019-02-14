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
    }
}
