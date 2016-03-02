import 'ui/autoload/styles';
import 'plugins/shield/views/login/login.less';
import kibanaLogoUrl from 'plugins/shield/images/kibana.svg';
import chrome from 'ui/chrome';
import template from 'plugins/shield/views/login/login.html';

chrome
.setVisible(false)
.setRootTemplate(template)
.setRootController('login', ($http) => {
  const {search, hash} = location;
  const index = search.indexOf('?next=');
  const next = index < 0 ? '' : decodeURIComponent(search.substr(index + '?next='.length)) + hash;

  return {
    kibanaLogoUrl,
    submit(username, password) {
      $http.post('./api/shield/v1/login', {username, password}).then(
        (response) => window.location.href = `.${next}`,
        (error) => this.error = true
      );
    }
  };
});
