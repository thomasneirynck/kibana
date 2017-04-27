import { format as formatUrl, resolve as resolveUrl } from 'url';

export function SecurityPageProvider({ getService, getPageObjects }) {
  const remote = getService('remote');
  const config = getService('config');
  const retry = getService('retry');
  const testSubjects = getService('testSubjects');
  const PageObjects = getPageObjects(['common']);

  class SecurityPage {
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
  }

  return new SecurityPage();
}
