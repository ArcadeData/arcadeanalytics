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
/* tslint:disable max-line-length */
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { JhiDateUtils, JhiDataUtils, JhiEventManager } from 'ng-jhipster';
import { ArcadeanalyticsTestModule } from '../../../test.module';
import { MockActivatedRoute } from '../../../helpers/mock-route.service';
import { ContractDetailComponent } from '../../../../../../main/webapp/app/entities/contract/contract-detail.component';
import { ContractService } from '../../../../../../main/webapp/app/entities/contract/contract.service';
import { Contract } from '../../../../../../main/webapp/app/entities/contract/contract.model';

describe('Component Tests', () => {

    describe('Contract Management Detail Component', () => {
        let comp: ContractDetailComponent;
        let fixture: ComponentFixture<ContractDetailComponent>;
        let service: ContractService;

        beforeEach(async(() => {
            TestBed.configureTestingModule({
                imports: [ArcadeanalyticsTestModule],
                declarations: [ContractDetailComponent],
                providers: [
                    JhiDateUtils,
                    JhiDataUtils,
                    DatePipe,
                    {
                        provide: ActivatedRoute,
                        useValue: new MockActivatedRoute({id: 123})
                    },
                    ContractService,
                    JhiEventManager
                ]
            }).overrideTemplate(ContractDetailComponent, '')
            .compileComponents();
        }));

        beforeEach(() => {
            fixture = TestBed.createComponent(ContractDetailComponent);
            comp = fixture.componentInstance;
            service = fixture.debugElement.injector.get(ContractService);
        });

        describe('OnInit', () => {
            it('Should call load all on init', () => {
            // GIVEN

            spyOn(service, 'find').and.returnValue(Observable.of(new Contract(10)));

            // WHEN
            comp.ngOnInit();

            // THEN
            expect(service.find).toHaveBeenCalledWith(123);
            expect(comp.contract).toEqual(jasmine.objectContaining({id: 10}));
            });
        });
    });

});
