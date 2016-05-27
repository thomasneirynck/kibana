import _ from 'lodash';
import routes from 'ui/routes';
import template from 'plugins/security/views/settings/account.html';
import 'plugins/security/services/shield_user';

routes.when('/settings/account', {
  template,
  resolve: {
    user(ShieldUser) {
      return ShieldUser.getCurrent();
    }
  },
  controller($scope, $route, Notifier) {
    $scope.user = $route.current.locals.user;
    $scope.view = {};

    const notifier = new Notifier();

    $scope.changePassword = (user) => {
      user.$changePassword()
      .then(() => notifier.info('The password has been changed.'))
      .catch(error => notifier.error(_.get(error, 'data.message')));
    };
  }
});
