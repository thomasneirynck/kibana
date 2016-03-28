import 'ui/autoload/styles';
import 'plugins/security/views/login/login.less';
import chrome from 'ui/chrome';
import parseNext from 'plugins/security/lib/parse_next';
import template from 'plugins/security/views/login/login.html';

chrome
.setVisible(false)
.setRootTemplate(template)
.setRootController('login', ($http) => {
  const next = parseNext(window.location);
  return {
    submit(username, password) {
      this.error = false;
      $http.post('./api/security/v1/login', {username, password}).then(
        (response) => window.location.href = `.${next}`,
        (error) => this.error = true
      );
    }
  };
});
