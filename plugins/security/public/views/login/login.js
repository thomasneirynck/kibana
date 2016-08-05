import { parse } from 'url';
import { get } from 'lodash';
import 'ui/autoload/styles';
import 'plugins/security/views/login/login.less';
import chrome from 'ui/chrome';
import parseNext from 'plugins/security/lib/parse_next';
import template from 'plugins/security/views/login/login.html';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';

const messageMap = {
  SESSION_EXPIRED: 'Your session has expired. Please log in again.'
};

chrome
.setVisible(false)
.setRootTemplate(template)
.setRootController('login', function ($http, $window, secureCookies, Private) {
  const xpackInfo = Private(XPackInfoProvider);
  const next = parseNext($window.location);
  const isSecure = !!$window.location.protocol.match(/^https/);
  const self = this;

  function setupScope() {
    const defaultLoginMessage = 'Login is currently disabled because the license could not be determined. '
    + 'Please check that Elasticsearch is running, then refresh this page.';
    self.allowLogin = xpackInfo.get('features.security.allowLogin', false);
    self.loginMessage = xpackInfo.get('features.security.loginMessage', defaultLoginMessage);
    self.infoMessage = get(messageMap, parse($window.location.href, true).query.msg);
    self.isDisabled = !isSecure && secureCookies;
    self.submit = (username, password) => {
      self.error = false;
      $http.post('./api/security/v1/login', {username, password}).then(
        () => $window.location.href = `.${next}`,
        () => self.error = true
      );
    };
  }

  // Make an API call so xpack info is populated in local storage
  // by interceptor. This can be any call that doesn't require auth.
  $http.get(chrome.addBasePath('/api/xpack/v1/info'))
  .then(setupScope)
  .catch(setupScope);

});
