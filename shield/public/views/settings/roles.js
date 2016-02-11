import routes from 'ui/routes';
import template from 'plugins/shield/views/settings/roles.html';
import 'plugins/shield/services/shield_role';

routes.when('/settings/security/roles', {
  template,
  resolve: {
    roles(ShieldRole) {
      return ShieldRole.query();
    }
  },
  controller($scope, $route, $q) {
    $scope.roles = $route.current.locals.roles;
    $scope.selectedRoles = [];

    $scope.deleteRoles = () => {
      if (!confirm(`Are you sure you want to delete the selected role(s)? This action is irreversible!`)) return;
      $q.all($scope.selectedRoles.map((role) => role.$delete()))
      .then(() => {
        $scope.selectedRoles.map((role) => {
          const i = $scope.roles.indexOf(role);
          $scope.roles.splice(i, 1);
        });
        $scope.selectedRoles.length = 0;
      });
    };

    $scope.toggleAll = () => {
      if ($scope.allSelected()) {
        $scope.selectedRoles.length = 0;
      } else {
        $scope.selectedRoles = $scope.roles.slice();
      }
    };

    $scope.allSelected = () => $scope.roles.length && $scope.roles.length === $scope.selectedRoles.length;

    $scope.toggleSelected = (role) => {
      const i = $scope.selectedRoles.indexOf(role);
      if (i >= 0) {
        $scope.selectedRoles.splice(i, 1);
      } else {
        $scope.selectedRoles.push(role);
      }
    };

    $scope.isSelected = (role) => $scope.selectedRoles.indexOf(role) >= 0;
  }
});
