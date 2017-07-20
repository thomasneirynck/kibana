import expect from 'expect.js';
import {
  USERS_PATH,
  EDIT_USERS_PATH,
  ROLES_PATH,
  EDIT_ROLES_PATH,
} from '../../../../plugins/security/public/views/management/management_urls';

export default function ({ getService, getPageObjects }) {
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const remote = getService('remote');
  const find = getService('find');
  const PageObjects = getPageObjects(['security', 'settings', 'common', 'header']);

  describe('Management', () => {
    before(async () => {
      await PageObjects.security.initTests();
      await kibanaServer.uiSettings.update({
        'dateFormat:tz':'UTC',
        'defaultIndex':'logstash-*'
      });
      await PageObjects.settings.navigateTo();
    });

    describe('Security', async () => {
      describe('navigation', async () => {
        it('Can navigate to create user section', async () => {
          await PageObjects.security.clickElasticsearchUsers();
          await PageObjects.security.clickCreateNewUser();
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(EDIT_USERS_PATH);
        });

        it('Clicking cancel in create user section brings user back to listing', async () => {
          await PageObjects.security.clickCancelEditUser();
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(USERS_PATH);
          expect(currentUrl).to.not.contain(EDIT_USERS_PATH);
        });

        it('Clicking save in create user section brings user back to listing', async () => {
          await PageObjects.security.clickCreateNewUser();

          await testSubjects.find('userFormUserNameInput').type('new-user');
          await testSubjects.find('passwordInput').type('123456');
          await testSubjects.find('passwordConfirmationInput').type('123456');
          await testSubjects.find('userFormFullNameInput').type('Full User Name');
          await testSubjects.find('userFormEmailInput').type('my@email.com');

          await PageObjects.security.clickSaveEditUser();
          await PageObjects.header.clickToastOK();

          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(USERS_PATH);
          expect(currentUrl).to.not.contain(EDIT_USERS_PATH);
        });

        it('Can navigate to edit user section', async () => {
          await PageObjects.settings.clickLinkText('new-user');
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(EDIT_USERS_PATH);

          const userNameInput = await testSubjects.find('userFormUserNameInput').getProperty('value');
          expect(userNameInput).to.equal('new-user');
        });

        it('Can navigate to roles section', async () => {
          await PageObjects.settings.clickLinkText('Roles');
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(ROLES_PATH);
        });

        it('Can navigate to create role section', async () => {
          await PageObjects.security.clickCreateNewRole();
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(EDIT_ROLES_PATH);
        });

        it('Clicking cancel in create role section brings user back to listing', async () => {
          await PageObjects.security.clickCancelEditRole();
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(ROLES_PATH);
          expect(currentUrl).to.not.contain(EDIT_ROLES_PATH);
        });

        it('Clicking save in create role section brings user back to listing', async () => {
          await PageObjects.security.clickCreateNewRole();

          await testSubjects.find('roleFormNameInput').type('my-new-role');

          await PageObjects.security.clickSaveEditRole();
          await PageObjects.header.clickToastOK();

          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(ROLES_PATH);
          expect(currentUrl).to.not.contain(EDIT_ROLES_PATH);
        });

        it('Can navigate to edit role section', async () => {
          await PageObjects.settings.clickLinkText('my-new-role');
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(EDIT_ROLES_PATH);

          const userNameInput = await testSubjects.find('roleFormNameInput').getProperty('value');
          expect(userNameInput).to.equal('my-new-role');
        });

        it('Can navigate to edit role section from users page', async () => {
          await PageObjects.settings.clickLinkText('Users');
          await PageObjects.settings.clickLinkText('superuser');
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(EDIT_ROLES_PATH);
        });

        it('Reserved roles are not editable', async () => {
          const dashOnlyModeRadio = await PageObjects.security.getDashboardOnlyModeOption();
          expect(await dashOnlyModeRadio.getProperty('disabled')).to.be(true);

          const allAppsRadio = await PageObjects.security.getAllAppsViewModeOption();
          expect(await allAppsRadio.getProperty('disabled')).to.be(true);

          const allInputs = await find.allByCssSelector('input');
          for (let i = 0; i < allInputs.length; i++) {
            const input = allInputs[i];
            expect(await input.getProperty('disabled')).to.be(true);
          }

          const allCheckboxes = await find.allByCssSelector('checkbox');
          for (let i = 0; i < allCheckboxes.length; i++) {
            const checkbox = allCheckboxes[i];
            expect(await checkbox.getProperty('disabled')).to.be(true);
          }
        });
      });
    });
  });
}
