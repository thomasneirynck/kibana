import {clone} from 'lodash';
import routes from 'ui/routes';
import template from 'plugins/security/views/settings/edit_role.html';
import 'angular-resource';
import 'plugins/security/services/shield_user';
import 'plugins/security/services/shield_role';
import 'plugins/security/views/settings/edit_user.less';

routes.when('/settings/security/roles/edit/:name?', {
  template,
  resolve: {
    role($route, ShieldRole) {
      const name = $route.current.params.name;
      if (name != null) return ShieldRole.get({name});
      return new ShieldRole({
        cluster: [],
        indices: []
      });
    },
    users(ShieldUser) {
      return ShieldUser.query();
    }
  },
  controller($scope, $route, $location) {
    $scope.isNewRole = $route.current.params.name == null;
    $scope.role = $route.current.locals.role;
    $scope.users = $route.current.locals.users;
    $scope.newIndex = {name: '', privileges: []};
    $scope.newPrivilege = '';

    $scope.deleteRole = (role) => {
      if (!confirm('Are you sure you want to delete this role? This action is irreversible!')) return;
      role.$delete().then($scope.goToRoleList);
    };

    $scope.saveRole = (role) => {
      role.$save().then($scope.goToRoleList);
    };

    $scope.goToRoleList = () => {
      $location.path('/settings/security/roles');
    };

    $scope.removePrivilege = (index, privilege) => {
      index.privileges.splice(index.privileges.indexOf(privilege), 1);
    };

    $scope.addPrivilege = (index, privilege) => {
      index.privileges.push(privilege);
    };

    $scope.removeIndex = (role, index) => {
      role.indices.splice(role.indices.indexOf(index), 1);
    };

    $scope.addIndex = (role, index) => {
      role.indices.push(clone(index));
    };
  }
});
