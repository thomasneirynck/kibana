require('plugins/shield/views/login/login.less');
const kibanaLogoUrl = require('plugins/shield/images/kibana.svg');

require('ui/chrome')
.setVisible(false)
.setRootTemplate(require('plugins/shield/views/login/login.html'))
.setRootController('login', ($http) => {
  return {
    kibanaLogoUrl,
    submit(username, password) {
      $http.post('./api/shield/v1/login', {username, password}).then(
        (response) => window.location.href = './',
        (error) => this.error = true
      );
    }
  };
});