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
import { browser, element, by, $ } from 'protractor';
import { NavBarPage } from './../page-objects/jhi-page-objects';


describe('Organization e2e test', () => {

    let navBarPage: NavBarPage;
    let organizationDialogPage: OrganizationDialogPage;
    let organizationComponentsPage: OrganizationComponentsPage;


    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load Organizations', () => {
        navBarPage.goToEntity('organization');
        organizationComponentsPage = new OrganizationComponentsPage();
        expect(organizationComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.organization.home.title/);

    });

    it('should load create Organization dialog', () => {
        organizationComponentsPage.clickOnCreateButton();
        organizationDialogPage = new OrganizationDialogPage();
        expect(organizationDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.organization.home.createOrEditLabel/);
        organizationDialogPage.close();
    });

    it('should create and save Organizations', () => {
        organizationComponentsPage.clickOnCreateButton();
        organizationDialogPage.save();
        expect(organizationDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class OrganizationComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-organization div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class OrganizationDialogPage {
    modalTitle = element(by.css('h4#myOrganizationLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));

    getModalTitle() {
        return this.modalTitle.getAttribute('jhiTranslate');
    }

    save() {
        this.saveButton.click();
    }

    close() {
        this.closeButton.click();
    }

    getSaveButton() {
        return this.saveButton;
    }
}
