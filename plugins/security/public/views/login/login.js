import 'ui/autoload/styles';
import 'plugins/security/views/login/login.less';
import { get } from 'lodash';
import chrome from 'ui/chrome';
import parseNext from 'plugins/security/lib/parse_next';
import template from 'plugins/security/views/login/login.html';

chrome
.setVisible(false)
.setRootTemplate(template)
.setRootController('login', ($http, $scope, $window, secureCookies) => {
  const next = parseNext($window.location);
  const isSecure = !!$window.location.protocol.match(/^https/);

  // Make an API call so xpack info is populated in local storage
  // by interceptor. This can be any call that doesn't require auth.
  return $http.get(chrome.addBasePath('/api/xpack/v1/info'))
  .then(() => {
    const xpackInfo = JSON.parse($window.localStorage.getItem('xpackMain.info'));
    const defaultLoginMessage = 'Login is currently disabled because the license could not be determined.';
    $scope.allowLogin = get(xpackInfo, 'features.security.allowLogin', false);
    $scope.loginMessage = get(xpackInfo, 'features.security.loginMessage', defaultLoginMessage);

    $scope.isDisabled = !isSecure && secureCookies;
    $scope.submit = (username, password) => {
      $scope.error = false;
      $http.post('./api/security/v1/login', {username, password}).then(
        () => $window.location.href = `.${next}`,
        () => $scope.error = true
      );
    };
  });

});
