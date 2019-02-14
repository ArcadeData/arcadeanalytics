import { browser, element, by, $ } from 'protractor';
import { NavBarPage } from './../page-objects/jhi-page-objects';


describe('ArcadeUser e2e test', () => {

    let navBarPage: NavBarPage;
    let arcadeUserDialogPage: ArcadeUserDialogPage;
    let arcadeUserComponentsPage: ArcadeUserComponentsPage;


    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load ArcadeUsers', () => {
        navBarPage.goToEntity('arcade-user');
        arcadeUserComponentsPage = new ArcadeUserComponentsPage();
        expect(arcadeUserComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.arcadeUser.home.title/);

    });

    it('should load create ArcadeUser dialog', () => {
        arcadeUserComponentsPage.clickOnCreateButton();
        arcadeUserDialogPage = new ArcadeUserDialogPage();
        expect(arcadeUserDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.arcadeUser.home.createOrEditLabel/);
        arcadeUserDialogPage.close();
    });

    it('should create and save ArcadeUsers', () => {
        arcadeUserComponentsPage.clickOnCreateButton();
        arcadeUserDialogPage.userSelectLastOption();
        arcadeUserDialogPage.companySelectLastOption();
        arcadeUserDialogPage.save();
        expect(arcadeUserDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class ArcadeUserComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-arcade-user div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class ArcadeUserDialogPage {
    modalTitle = element(by.css('h4#myArcadeUserLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    userSelect = element(by.css('select#field_user'));
    companySelect = element(by.css('select#field_company'));

    getModalTitle() {
        return this.modalTitle.getAttribute('jhiTranslate');
    }

    userSelectLastOption = function () {
        this.userSelect.all(by.tagName('option')).last().click();
    }

    userSelectOption = function (option) {
        this.userSelect.sendKeys(option);
    }

    getUserSelect = function () {
        return this.userSelect;
    }

    getUserSelectedOption = function () {
        return this.userSelect.element(by.css('option:checked')).getText();
    }

    companySelectLastOption = function () {
        this.companySelect.all(by.tagName('option')).last().click();
    }

    companySelectOption = function (option) {
        this.companySelect.sendKeys(option);
    }

    getCompanySelect = function () {
        return this.companySelect;
    }

    getCompanySelectedOption = function () {
        return this.companySelect.element(by.css('option:checked')).getText();
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
