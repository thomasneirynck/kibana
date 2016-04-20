import {includes} from 'lodash';
import routes from 'ui/routes';
import {toggle, toggleSort} from 'plugins/security/lib/util';
import template from 'plugins/security/views/settings/users.html';
import 'plugins/security/services/shield_user';

routes.when('/settings/security/users', {
  template,
  resolve: {
    users(ShieldUser) {
      return ShieldUser.query();
    }
  },
  controller($scope, $route, $q, Notifier) {
    $scope.users = $route.current.locals.users;
    $scope.selectedUsers = [];
    $scope.sort = {orderBy: 'full_name', reverse: false};

    const notifier = new Notifier();

    $scope.deleteUsers = () => {
      if (!confirm('Are you sure you want to delete the selected user(s)? This action is irreversible!')) return;
      $q.all($scope.selectedUsers.map((user) => user.$delete()))
      .then(() => notifier.info('The user(s) have been deleted.'))
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
        $scope.selectedUsers = getActionableUsers().slice();
      }
    };

    $scope.allSelected = () => {
      const users = getActionableUsers();
      return users.length && users.length === $scope.selectedUsers.length;
    };

    $scope.toggle = toggle;
    $scope.includes = includes;
    $scope.toggleSort = toggleSort;

    function getActionableUsers() {
      return $scope.users.filter((user) => !user.metadata._reserved);
    }
  }
});
