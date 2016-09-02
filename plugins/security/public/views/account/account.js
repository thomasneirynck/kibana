import _ from 'lodash';
import routes from 'ui/routes';
import template from './account.html';
import './account.less';
import '../../services/shield_user';

routes.when('/account', {
  template,
  resolve: {
    user(ShieldUser) {
      return ShieldUser.getCurrentUser();
    }
  },
  controller($scope, $route, Notifier) {
    $scope.user = $route.current.locals.user;
    $scope.view = {
      changePasswordMode: false
    };

    const notifier = new Notifier();

    $scope.changePassword = (user) => {
      user.$changePassword()
      .then(() => notifier.info('The password has been changed.'))
      .then($scope.toggleChangePasswordMode)
      .catch(error => notifier.error(_.get(error, 'data.message')));
    };

    $scope.toggleChangePasswordMode = () => {
      delete $scope.user.password;
      delete $scope.view.confirmPassword;
      $scope.view.changePasswordMode = !$scope.view.changePasswordMode;
    };
  }
});
