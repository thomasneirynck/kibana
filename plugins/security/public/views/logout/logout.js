import chrome from 'ui/chrome';
import 'plugins/security/views/logout/logout.less';

chrome
.setVisible(false)
.setRootController('logout', ($http) => {
  $http.post('./api/security/v1/logout', {}).then(
    () => window.location.href = './login'
  );
});
