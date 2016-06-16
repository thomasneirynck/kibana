import _ from 'lodash';
import routes from 'ui/routes';
import template from 'plugins/security/views/management/edit_user.html';
import 'angular-resource';
import 'angular-ui-select';
import 'plugins/security/services/shield_user';
import 'plugins/security/services/shield_role';
import 'plugins/security/views/management/edit_user.less';

routes.when('/management/elasticsearch/users/edit/:username?', {
  template,
  resolve: {
    user($route, ShieldUser) {
      const username = $route.current.params.username;
      if (username != null) return ShieldUser.get({username});
      return new ShieldUser({roles: []});
    },
    roles(ShieldRole) {
      return ShieldRole.query().$promise
      .then((roles) => _.map(roles, 'name'));
    }
  },
  controller($scope, $route, $location, ShieldUser, Notifier) {
    $scope.user = $route.current.locals.user;
    $scope.availableRoles = $route.current.locals.roles;
    $scope.view = {
      isNewUser: $route.current.params.username == null,
      changePasswordMode: false
    };

    const notifier = new Notifier();

    $scope.deleteUser = (user) => {
      if (!confirm('Are you sure you want to delete this user? This action is irreversible!')) return;
      user.$delete()
      .then(() => notifier.info('The user has been deleted.'))
      .then($scope.goToUserList)
      .catch(error => notifier.error(_.get(error, 'data.message')));
    };

    $scope.saveUser = (user) => {
      user.$save()
      .then(() => notifier.info('The user has been updated.'))
      .then($scope.goToUserList)
      .catch(error => notifier.error(_.get(error, 'data.message')));
    };

    $scope.goToUserList = () => {
      $location.path('/management/elasticsearch/users');
    };

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
