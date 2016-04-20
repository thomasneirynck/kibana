import _ from 'lodash';
import routes from 'ui/routes';
import template from 'plugins/security/views/settings/edit_user.html';
import 'angular-resource';
import 'plugins/security/services/shield_user';
import 'plugins/security/services/shield_role';
import 'plugins/security/views/settings/edit_user.less';

routes.when('/settings/security/users/edit/:username?', {
  template,
  resolve: {
    user($route, ShieldUser) {
      const username = $route.current.params.username;
      if (username != null) return ShieldUser.get({username});
      return new ShieldUser({roles: []});
    },
    roles(ShieldRole) {
      return ShieldRole.query();
    }
  },
  controller($scope, $route, $location, ShieldUser, Notifier) {
    $scope.user = $route.current.locals.user;
    $scope.availableRoles = $route.current.locals.roles;
    $scope.view = {
      isNewUser: $route.current.params.username == null,
      selectedAvailableRoles: [],
      selectedAssignedRoles: [],
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
      $location.path('/settings/security/users');
    };

    $scope.changePassword = (user) => {
      ShieldUser.changePassword(user)
      .then(() => notifier.info('The password has been changed.'))
      .then($scope.toggleChangePasswordMode)
      .catch(error => notifier.error(_.get(error, 'data.message')));
    };

    $scope.assignRoles = (user, roles) => {
      user.roles = _.union(user.roles, roles);
      roles.length = 0;
    };

    $scope.removeRoles = (user, roles) => {
      user.roles = _.difference(user.roles, roles);
      roles.length = 0;
    };

    $scope.toggleChangePasswordMode = () => {
      delete $scope.user.password;
      delete $scope.view.confirmPassword;
      $scope.view.changePasswordMode = !$scope.view.changePasswordMode;
    };
  }
});
