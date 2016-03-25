import routes from 'ui/routes';
import template from 'plugins/security/views/settings/users.html';
import 'plugins/security/services/shield_user';

routes.when('/settings/security/users', {
  template,
  resolve: {
    users(ShieldUser) {
      return ShieldUser.query();
    }
  },
  controller($scope, $route, $q) {
    $scope.users = $route.current.locals.users;
    $scope.selectedUsers = [];

    $scope.deleteUsers = () => {
      if (!confirm('Are you sure you want to delete the selected user(s)? This action is irreversible!')) return;
      $q.all($scope.selectedUsers.map((user) => user.$delete()))
      .then(() => {
        $scope.selectedUsers.map((user) => {
          const i = $scope.users.indexOf(user);
          $scope.users.splice(i, 1);
        });
        $scope.selectedUsers.length = 0;
      });
    };

    $scope.toggleAll = () => {
      if ($scope.allSelected()) {
        $scope.selectedUsers.length = 0;
      } else {
        $scope.selectedUsers = $scope.users.slice();
      }
    };

    $scope.allSelected = () => $scope.users.length && $scope.users.length === $scope.selectedUsers.length;

    $scope.toggleSelected = (user) => {
      const i = $scope.selectedUsers.indexOf(user);
      if (i >= 0) {
        $scope.selectedUsers.splice(i, 1);
      } else {
        $scope.selectedUsers.push(user);
      }
    };

    $scope.isSelected = (user) => $scope.selectedUsers.indexOf(user) >= 0;
  }
});
