import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ArcadeanalyticsWorkspaceModule } from './workspace/workspace.module';
import { ArcadeanalyticsDashboardModule } from './dashboard/dashboard.module';
import { ArcadeanalyticsWidgetModule } from './widget/widget.module';
import { ArcadeanalyticsDataSourceModule } from './data-source/data-source.module';
import { ArcadeanalyticsDataSetModule } from './data-set/data-set.module';
import { ArcadeanalyticsMediaModule } from './media/media.module';
import { ArcadeanalyticsContractModule } from './contract/contract.module';
import { ArcadeanalyticsCompanyModule } from './company/company.module';
import { ArcadeanalyticsArcadeUserModule } from './arcade-user/arcade-user.module';
/* jhipster-needle-add-entity-module-import - JHipster will add entity modules imports here */

@NgModule({
    imports: [
        ArcadeanalyticsWorkspaceModule,
        ArcadeanalyticsDashboardModule,
        ArcadeanalyticsWidgetModule,
        ArcadeanalyticsDataSourceModule,
        ArcadeanalyticsDataSetModule,
        ArcadeanalyticsMediaModule,
        ArcadeanalyticsContractModule,
        ArcadeanalyticsCompanyModule,
        ArcadeanalyticsArcadeUserModule,
        /* jhipster-needle-add-entity-module - JHipster will add entity modules here */
    ],
    declarations: [],
    entryComponents: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArcadeanalyticsEntityModule { }
