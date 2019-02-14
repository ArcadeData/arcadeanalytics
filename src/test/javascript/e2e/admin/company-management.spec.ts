import { browser, element, by, $ } from 'protractor';
import { NavBarPage } from './../page-objects/jhi-page-objects';

describe('Organization-management e2e test', () => {

    let navBarPage: NavBarPage;
    let organizationMgmtDialogPage: OrganizationMgmtDialogPage;
    let organizationMgmtComponentsPage: OrganizationMgmtComponentsPage;

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage(true);
        organizationMgmtComponentsPage = new OrganizationMgmtComponentsPage();
        organizationMgmtDialogPage = new OrganizationMgmtDialogPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
        navBarPage.clickOnAdminMenu();
        navBarPage.clickOnAdmin("organization-management");
        browser.waitForAngular();
    });

    it('should load create organization dialog', () => {
        organizationMgmtComponentsPage.clickOnCreateButton();
        expect(organizationMgmtDialogPage.getModalTitle()).toMatch(/organizationManagement.home.createLabel/);
        organizationMgmtDialogPage.close();
    });

   it('should create and save companies', () => {
        organizationMgmtComponentsPage.clickOnCreateButton();
        organizationMgmtDialogPage.setNameInput('new organization');
        expect(organizationMgmtDialogPage.getNameInput()).toMatch('new organization');
        organizationMgmtDialogPage.save();
        expect(organizationMgmtDialogPage.getSaveButton().isPresent()).toBeFalsy();
    });

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class OrganizationMgmtComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class OrganizationMgmtDialogPage {
    modalTitle = element(by.css('.modal-title'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    nameInput = element(by.css('input#field_name'));

    getModalTitle() {
        return this.modalTitle.getAttribute('jhiTranslate');
    }

    setNameInput = function (name) {
        this.nameInput.sendKeys(name);
    }

    getNameInput = function () {
        return this.nameInput.getAttribute('value');
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
