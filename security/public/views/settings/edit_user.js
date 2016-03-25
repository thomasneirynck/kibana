import {union, difference} from 'lodash';
import routes from 'ui/routes';
import template from 'plugins/shield/views/settings/edit_user.html';
import 'angular-resource';
import 'plugins/shield/services/shield_user';
import 'plugins/shield/services/shield_role';
import 'plugins/shield/views/settings/edit_user.less';

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
  controller($scope, $route, $location) {
    $scope.isNewUser = $route.current.params.username == null;
    $scope.user = $route.current.locals.user;
    $scope.availableRoles = $route.current.locals.roles;
    $scope.selectedAvailableRoles = [];
    $scope.selectedAssigneldRoles = [];

    $scope.deleteUser = (user) => {
      if (!confirm('Are you sure you want to delete this user? This action is irreversible!')) return;
      user.$delete().then($scope.goToUserList);
    };

    $scope.saveUser = (user) => {
      user.$save().then($scope.goToUserList);
    };

    $scope.goToUserList = () => {
      $location.path('/settings/security/users');
    };

    $scope.assignRoles = (user, roles) => {
      user.roles = union(user.roles, roles);
      roles.length = 0;
    };

    $scope.removeRoles = (user, roles) => {
      user.roles = difference(user.roles, roles);
      roles.length = 0;
    };
  }
});
