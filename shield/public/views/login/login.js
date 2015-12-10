require('plugins/shield/views/login/login.less');
const kibanaLogoUrl = require('plugins/shield/images/kibana.svg');

require('ui/chrome')
.setVisible(false)
.setRootTemplate(require('plugins/shield/views/login/login.html'))
.setRootController('login', ($http) => {
  const login = {
    loading: false,
    kibanaLogoUrl
  };

  login.submit = (username, password) => {
    login.loading = true;

    $http.post('/api/shield/v1/login', {
      username: username,
      password: password
    }).then(
      (response) => window.location.href = '/', // TODO: Redirect more intelligently
      (error) => login.error = true
    ).finally(() => login.loading = false);
  };

  return login;
});