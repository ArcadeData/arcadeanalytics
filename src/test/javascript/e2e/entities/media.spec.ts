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
const path = require('path');

describe('Media e2e test', () => {

    let navBarPage: NavBarPage;
    let mediaDialogPage: MediaDialogPage;
    let mediaComponentsPage: MediaComponentsPage;
    const fileToUpload = '../../../../main/webapp/content/images/logo-jhipster.png';
    const absolutePath = path.resolve(__dirname, fileToUpload);
    

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load Media', () => {
        navBarPage.goToEntity('media');
        mediaComponentsPage = new MediaComponentsPage();
        expect(mediaComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.media.home.title/);

    });

    it('should load create Media dialog', () => {
        mediaComponentsPage.clickOnCreateButton();
        mediaDialogPage = new MediaDialogPage();
        expect(mediaDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.media.home.createOrEditLabel/);
        mediaDialogPage.close();
    });

    it('should create and save Media', () => {
        mediaComponentsPage.clickOnCreateButton();
        mediaDialogPage.setNameInput('name');
        expect(mediaDialogPage.getNameInput()).toMatch('name');
        mediaDialogPage.setDescriptionInput('description');
        expect(mediaDialogPage.getDescriptionInput()).toMatch('description');
        mediaDialogPage.categorySelectLastOption();
        mediaDialogPage.setFileInput(absolutePath);
        mediaDialogPage.save();
        expect(mediaDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class MediaComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-media div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class MediaDialogPage {
    modalTitle = element(by.css('h4#myMediaLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    nameInput = element(by.css('input#field_name'));
    descriptionInput = element(by.css('input#field_description'));
    categorySelect = element(by.css('select#field_category'));
    fileInput = element(by.css('input#file_file'));

    getModalTitle() {
        return this.modalTitle.getAttribute('jhiTranslate');
    }

    setNameInput = function (name) {
        this.nameInput.sendKeys(name);
    }

    getNameInput = function () {
        return this.nameInput.getAttribute('value');
    }

    setDescriptionInput = function (description) {
        this.descriptionInput.sendKeys(description);
    }

    getDescriptionInput = function () {
        return this.descriptionInput.getAttribute('value');
    }

    setCategorySelect = function (category) {
        this.categorySelect.sendKeys(category);
    }

    getCategorySelect = function () {
        return this.categorySelect.element(by.css('option:checked')).getText();
    }

    categorySelectLastOption = function () {
        this.categorySelect.all(by.tagName('option')).last().click();
    }
    setFileInput = function (file) {
        this.fileInput.sendKeys(file);
    }

    getFileInput = function () {
        return this.fileInput.getAttribute('value');
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
