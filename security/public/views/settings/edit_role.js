import {cloneDeep, toggleInOut, includes} from 'lodash';
import routes from 'ui/routes';
import template from 'plugins/security/views/settings/edit_role.html';
import 'angular-resource';
import 'plugins/security/services/shield_user';
import 'plugins/security/services/shield_role';
import 'plugins/security/services/shield_privileges';
import 'plugins/security/views/settings/edit_user.less';

routes.when('/settings/security/roles/edit/:name?', {
  template,
  resolve: {
    role($route, ShieldRole) {
      const name = $route.current.params.name;
      if (name != null) return ShieldRole.get({name});
      return new ShieldRole({
        cluster: [],
        indices: [],
        run_as: []
      });
    },
    users(ShieldUser) {
      return ShieldUser.query();
    }
  },
  controller($scope, $route, $location, shieldPrivileges) {
    $scope.isNewRole = $route.current.params.name == null;
    $scope.role = $route.current.locals.role;
    $scope.users = $route.current.locals.users;
    $scope.privileges = shieldPrivileges;
    $scope.newIndex = {names: [''], privileges: [], fields: []};
    $scope.newPrivileges = [];
    $scope.newFields = [];

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

    $scope.addIndex = (indices, index) => {
      indices.push(cloneDeep(index));
    };

    $scope.toggleSafe = (parent, key, item) => {
      parent[key] = parent[key] || [];
      toggleInOut(parent[key], item);
    };

    $scope.toggle = toggleInOut;
    $scope.includes = includes;
  }
});
