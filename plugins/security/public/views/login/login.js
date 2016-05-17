import 'ui/autoload/styles';
import 'plugins/security/views/login/login.less';
import chrome from 'ui/chrome';
import parseNext from 'plugins/security/lib/parse_next';
import template from 'plugins/security/views/login/login.html';

chrome
.setVisible(false)
.setRootTemplate(template)
.setRootController('login', ($http, $window, shieldUnsafeSessions, allowLogin) => {
  const next = parseNext($window.location);
  const isSecure = !!$window.location.protocol.match(/^https/);

  return {
    allowLogin,
    isDisabled: !isSecure && !shieldUnsafeSessions,
    allowUnsafe: shieldUnsafeSessions,
    submit(username, password) {
      this.error = false;
      $http.post('./api/security/v1/login', {username, password}).then(
        () => $window.location.href = `.${next}`,
        () => this.error = true
      );
    }
  };
});
