import { format as formatUrl, resolve as resolveUrl } from 'url';

export function SecurityPageProvider({ getService, getPageObjects }) {
  const remote = getService('remote');
  const config = getService('config');
  const retry = getService('retry');
  const log = getService('log');
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const esArchiver = getService('esArchiver');
  const PageObjects = getPageObjects(['common', 'header']);

  class SecurityPage {
    async initTests() {
      await kibanaServer.uiSettings.disableToastAutohide();
      log.debug('SecurityPage:initTests');
      await esArchiver.load('empty_kibana');
      await esArchiver.loadIfNeeded('logstash_functional');
      remote.setWindowSize(1600,1000);
    }

    async login() {
      const [username, password] = config.get('servers.elasticsearch.auth').split(':');

      await PageObjects.common.navigateToApp('login');
      await testSubjects.find('loginUsername').type(username);
      await testSubjects.find('loginPassword').type(password);
      await testSubjects.click('loginSubmit');
      await retry.try(() => testSubjects.exists('kibanaChrome'));
    }

    async logout() {
      await remote.get(formatUrl({
        ...config.get('servers.kibana'),
        auth: null,
        pathname: resolveUrl(config.get('servers.kibana.pathname') || '/', 'logout')
      }));
    }

    async clickCreateNewUser() {
      await retry.try(() => testSubjects.click('createUserButton'));
    }

    async clickCreateNewRole() {
      await retry.try(() => testSubjects.click('createRoleButton'));
    }

    async getCreateIndexPatternInputFieldExists() {
      return await testSubjects.exists('createIndexPatternNameInput');
    }

    async clickCancelEditUser() {
      await retry.try(() => testSubjects.click('userFormCancelButton'));
    }

    async clickCancelEditRole() {
      await retry.try(() => testSubjects.click('roleFormCancelButton'));
    }

    async clickSaveEditUser() {
      await retry.try(() => testSubjects.click('userFormSaveButton'));
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async clickSaveEditRole() {
      await retry.try(() => testSubjects.click('roleFormSaveButton'));
      await PageObjects.header.waitUntilLoadingHasFinished();
    }
  }

  return new SecurityPage();
}
