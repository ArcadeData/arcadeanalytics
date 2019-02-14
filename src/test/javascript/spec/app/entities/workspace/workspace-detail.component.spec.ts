/* tslint:disable max-line-length */
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { JhiDateUtils, JhiDataUtils, JhiEventManager } from 'ng-jhipster';
import { ArcadeanalyticsTestModule } from '../../../test.module';
import { MockActivatedRoute } from '../../../helpers/mock-route.service';
import { WorkspaceDetailComponent } from '../../../../../../main/webapp/app/entities/workspace/workspace-detail.component';
import { WorkspaceService } from '../../../../../../main/webapp/app/entities/workspace/workspace.service';
import { Workspace } from '../../../../../../main/webapp/app/entities/workspace/workspace.model';

describe('Component Tests', () => {

    describe('Workspace Management Detail Component', () => {
        let comp: WorkspaceDetailComponent;
        let fixture: ComponentFixture<WorkspaceDetailComponent>;
        let service: WorkspaceService;

        beforeEach(async(() => {
            TestBed.configureTestingModule({
                imports: [ArcadeanalyticsTestModule],
                declarations: [WorkspaceDetailComponent],
                providers: [
                    JhiDateUtils,
                    JhiDataUtils,
                    DatePipe,
                    {
                        provide: ActivatedRoute,
                        useValue: new MockActivatedRoute({id: 123})
                    },
                    WorkspaceService,
                    JhiEventManager
                ]
            }).overrideTemplate(WorkspaceDetailComponent, '')
            .compileComponents();
        }));

        beforeEach(() => {
            fixture = TestBed.createComponent(WorkspaceDetailComponent);
            comp = fixture.componentInstance;
            service = fixture.debugElement.injector.get(WorkspaceService);
        });

        describe('OnInit', () => {
            it('Should call load all on init', () => {
            // GIVEN

            spyOn(service, 'find').and.returnValue(Observable.of(new Workspace(10)));

            // WHEN
            comp.ngOnInit();

            // THEN
            expect(service.find).toHaveBeenCalledWith(123);
            expect(comp.workspace).toEqual(jasmine.objectContaining({id: 10}));
            });
        });
    });

});
