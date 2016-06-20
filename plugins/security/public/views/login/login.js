import 'ui/autoload/styles';
import 'plugins/security/views/login/login.less';
import { get } from 'lodash';
import chrome from 'ui/chrome';
import parseNext from 'plugins/security/lib/parse_next';
import template from 'plugins/security/views/login/login.html';

chrome
.setVisible(false)
.setRootTemplate(template)
.setRootController('login', function ($http, $window, secureCookies) {
  const next = parseNext($window.location);
  const isSecure = !!$window.location.protocol.match(/^https/);
  const self = this;

  function setupScope() {
    const xpackInfo = JSON.parse($window.localStorage.getItem('xpackMain.info')) || {};
    const defaultLoginMessage = 'Login is currently disabled because the license could not be determined.';
    self.allowLogin = get(xpackInfo, 'features.security.allowLogin', false);
    self.loginMessage = get(xpackInfo, 'features.security.loginMessage', defaultLoginMessage);
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
