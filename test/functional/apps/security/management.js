import expect from 'expect.js';
import {
  SECURITY_PATH,
  USERS_PATH,
  EDIT_USERS_PATH,
  ROLES_PATH,
  EDIT_ROLES_PATH,
} from '../../../../plugins/security/public/views/management/management_urls';

export default function ({ getService, getPageObjects }) {
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const remote = getService('remote');
  const PageObjects = getPageObjects(['security', 'settings', 'common', 'header', 'gettingStarted']);

  describe('Management', () => {
    before(async () => {
      await PageObjects.security.initTests();
      await kibanaServer.uiSettings.replace({
        'dateFormat:tz':'UTC',
        'defaultIndex':'logstash-*'
      });
      await PageObjects.gettingStarted.clickOptOutLink();
      await PageObjects.settings.navigateTo();
    });

    describe('Security', async () => {
      describe('navigation', async () => {
        it('can navigate to security section', async () => {
          await PageObjects.settings.clickLinkText('Security');
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(SECURITY_PATH);
        });

        it('Users is the default landing page for security', async () => {
          const currentUrl = await remote.getCurrentUrl();
          expect(currentUrl).to.contain(USERS_PATH);
        });

        it('Can navigate to create user section', async () => {
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

        it('Can navigate to create user section', async () => {
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
      });
    });
  });
}

