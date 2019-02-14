/* tslint:disable max-line-length */
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { JhiDateUtils, JhiDataUtils, JhiEventManager } from 'ng-jhipster';
import { ArcadeanalyticsTestModule } from '../../../test.module';
import { MockActivatedRoute } from '../../../helpers/mock-route.service';
import { DashboardDetailComponent } from '../../../../../../main/webapp/app/entities/dashboard/dashboard-detail.component';
import { DashboardService } from '../../../../../../main/webapp/app/entities/dashboard/dashboard.service';
import { Dashboard } from '../../../../../../main/webapp/app/entities/dashboard/dashboard.model';

describe('Component Tests', () => {

    describe('Dashboard Management Detail Component', () => {
        let comp: DashboardDetailComponent;
        let fixture: ComponentFixture<DashboardDetailComponent>;
        let service: DashboardService;

        beforeEach(async(() => {
            TestBed.configureTestingModule({
                imports: [ArcadeanalyticsTestModule],
                declarations: [DashboardDetailComponent],
                providers: [
                    JhiDateUtils,
                    JhiDataUtils,
                    DatePipe,
                    {
                        provide: ActivatedRoute,
                        useValue: new MockActivatedRoute({id: 123})
                    },
                    DashboardService,
                    JhiEventManager
                ]
            }).overrideTemplate(DashboardDetailComponent, '')
            .compileComponents();
        }));

        beforeEach(() => {
            fixture = TestBed.createComponent(DashboardDetailComponent);
            comp = fixture.componentInstance;
            service = fixture.debugElement.injector.get(DashboardService);
        });

        describe('OnInit', () => {
            it('Should call load all on init', () => {
            // GIVEN

            spyOn(service, 'find').and.returnValue(Observable.of(new Dashboard(10)));

            // WHEN
            comp.ngOnInit();

            // THEN
            expect(service.find).toHaveBeenCalledWith(123);
            expect(comp.dashboard).toEqual(jasmine.objectContaining({id: 10}));
            });
        });
    });

});
