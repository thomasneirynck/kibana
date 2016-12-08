import _ from 'lodash';
import uiModules from 'ui/modules';
import template from './index_privileges_form.html';

const module = uiModules.get('security', ['kibana']);
module.directive('kbnIndexPrivilegesForm', function () {
  return {
    template,
    scope: {
      indices: '=',
      indexPatterns: '=',
      privileges: '=',
      fieldOptions: '=',
      isReserved: '=',
      addIndex: '&',
      removeIndex: '&',
    },
    restrict: 'E',
    replace: true,
    controllerAs: 'indexPrivilegesController',
    controller: function ($scope) {
      this.addIndex = function addIndex() {
        $scope.addIndex({ indices: $scope.indices });
      };

      this.removeIndex = function removeIndex(index) {
        $scope.removeIndex({ indices: $scope.indices, index });
      };

      this.getIndexTitle = function getIndexTitle(index) {
        const indices = index.names.length ? index.names.join(', ') : 'No indices';
        const privileges = index.privileges.length ? index.privileges.join(', ') : 'No privileges';
        return `${indices} (${privileges})`;
      };

      this.union = _.flow(_.union, _.compact);
    },
  };
});
