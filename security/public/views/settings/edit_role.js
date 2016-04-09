import _ from 'lodash';
import routes from 'ui/routes';
import {toggle} from 'plugins/security/lib/util';
import template from 'plugins/security/views/settings/edit_role.html';
import 'angular-ui-select';
import 'plugins/security/services/shield_user';
import 'plugins/security/services/shield_role';
import 'plugins/security/services/shield_privileges';
import 'plugins/security/services/shield_indices';

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
    },
    indexPatterns(shieldIndices) {
      return shieldIndices.getIndexPatterns();
    }
  },
  controller($scope, $route, $location, shieldPrivileges, shieldIndices) {
    $scope.isNewRole = $route.current.params.name == null;
    $scope.role = $route.current.locals.role;
    $scope.users = $route.current.locals.users;
    $scope.indexPatterns = $route.current.locals.indexPatterns;
    $scope.privileges = shieldPrivileges;
    $scope.newIndex = {names: [], privileges: [], fields: []};
    $scope.fieldOptions = [];

    $scope.deleteRole = (role) => {
      if (!confirm('Are you sure you want to delete this role? This action is irreversible!')) return;
      role.$delete().then($scope.goToRoleList);
    };

    $scope.saveRole = (role) => {
      role.$save()
      .then($scope.goToRoleList)
      .catch(error => $scope.error = _.get(error, 'data.message') || 'Role name is required.');
    };

    $scope.goToRoleList = () => {
      $location.path('/settings/security/roles');
    };

    $scope.addIndex = (indices, index) => {
      indices.push(_.cloneDeep(index));
      index.names.length = 0;
    };

    $scope.getFields = (index, i) => {
      return shieldIndices.getFields(index.names.join(','))
      .then((fields) => $scope.fieldOptions[i] = fields)
      .catch(() => $scope.fieldOptions[i] = []);
    };

    $scope.$watch('role.indices.length', () => {
      _.map($scope.role.indices, (index, i) => $scope.getFields(index, i));
    });

    $scope.toggle = toggle;
    $scope.includes = _.includes;
    $scope.union = _.flow(_.union, _.compact);
  }
});
