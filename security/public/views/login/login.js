import 'ui/autoload/styles';
<<<<<<< HEAD:kibana/security/public/views/login/login.js
import 'plugins/security/views/login/login.less';
import kibanaLogoUrl from 'plugins/security/images/kibana.svg';
=======
import 'plugins/shield/views/login/login.less';
>>>>>>> master:kibana/shield/public/views/login/login.js
import chrome from 'ui/chrome';
import template from 'plugins/security/views/login/login.html';

chrome
.setVisible(false)
.setRootTemplate(template)
.setRootController('login', ($http) => {
  const {search, hash} = location;
  const index = search.indexOf('?next=');
  const next = index < 0 ? '/' : decodeURIComponent(search.substr(index + '?next='.length)) + hash;

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
