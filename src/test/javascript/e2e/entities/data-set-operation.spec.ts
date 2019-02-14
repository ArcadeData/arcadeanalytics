import { browser, element, by, $ } from 'protractor';
import { NavBarPage } from './../page-objects/jhi-page-objects';
const path = require('path');

describe('DataSetOperation e2e test', () => {

    let navBarPage: NavBarPage;
    let dataSetOperationDialogPage: DataSetOperationDialogPage;
    let dataSetOperationComponentsPage: DataSetOperationComponentsPage;
    const fileToUpload = '../../../../main/webapp/content/images/logo-jhipster.png';
    const absolutePath = path.resolve(__dirname, fileToUpload);
    

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load DataSetOperations', () => {
        navBarPage.goToEntity('data-set-operation');
        dataSetOperationComponentsPage = new DataSetOperationComponentsPage();
        expect(dataSetOperationComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.dataSetOperation.home.title/);

    });

    it('should load create DataSetOperation dialog', () => {
        dataSetOperationComponentsPage.clickOnCreateButton();
        dataSetOperationDialogPage = new DataSetOperationDialogPage();
        expect(dataSetOperationDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.dataSetOperation.home.createOrEditLabel/);
        dataSetOperationDialogPage.close();
    });

    it('should create and save DataSetOperations', () => {
        dataSetOperationComponentsPage.clickOnCreateButton();
        dataSetOperationDialogPage.setCreatedAtInput('2000-12-31');
        expect(dataSetOperationDialogPage.getCreatedAtInput()).toMatch('2000-12-31');
        dataSetOperationDialogPage.setOperationInput('operation');
        expect(dataSetOperationDialogPage.getOperationInput()).toMatch('operation');
        dataSetOperationDialogPage.datasetSelectLastOption();
        dataSetOperationDialogPage.save();
        expect(dataSetOperationDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class DataSetOperationComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-data-set-operation div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class DataSetOperationDialogPage {
    modalTitle = element(by.css('h4#myDataSetOperationLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    createdAtInput = element(by.css('input#field_createdAt'));
    operationInput = element(by.css('input#field_operation'));
    datasetSelect = element(by.css('select#field_dataset'));

    getModalTitle() {
        return this.modalTitle.getAttribute('jhiTranslate');
    }

    setCreatedAtInput = function (createdAt) {
        this.createdAtInput.sendKeys(createdAt);
    }

    getCreatedAtInput = function () {
        return this.createdAtInput.getAttribute('value');
    }

    setOperationInput = function (operation) {
        this.operationInput.sendKeys(operation);
    }

    getOperationInput = function () {
        return this.operationInput.getAttribute('value');
    }

    datasetSelectLastOption = function () {
        this.datasetSelect.all(by.tagName('option')).last().click();
    }

    datasetSelectOption = function (option) {
        this.datasetSelect.sendKeys(option);
    }

    getDatasetSelect = function () {
        return this.datasetSelect;
    }

    getDatasetSelectedOption = function () {
        return this.datasetSelect.element(by.css('option:checked')).getText();
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
