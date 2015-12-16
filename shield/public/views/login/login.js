require('plugins/shield/views/login/login.less');
const kibanaLogoUrl = require('plugins/shield/images/kibana.svg');

require('ui/chrome')
.setVisible(false)
.setRootTemplate(require('plugins/shield/views/login/login.html'))
.setRootController('login', ($http) => {
  return {
    kibanaLogoUrl,
    submit(username, password) {
      $http.post('/api/shield/v1/login', {
        username: username,
        password: password
      }).then(
        (response) => window.location.href = '/', // TODO: Redirect more intelligently
        (error) => this.error = true
      );
    }
  };
});