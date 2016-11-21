/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2016     *
 *                                                          *
 *----------------------------------------------------------*
 *----------------------------------------------------------*
 * WARNING:                                                 *
 * THIS FILE CONTAINS UNPUBLISHED PROPRIETARY               *
 * SOURCE CODE WHICH IS THE PROPERTY OF PRELERT LTD AND     *
 * PARENT OR SUBSIDIARY COMPANIES.                          *
 * PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:         *
 *                                                          *
 * This source code is confidential and any person who      *
 * receives a copy of it, or believes that they are viewing *
 * it without permission is asked to notify Prelert Ltd     *
 * on +44 (0)20 3567 1249 or email to legal@prelert.com.    *
 * All intellectual property rights in this source code     *
 * are owned by Prelert Ltd.  No part of this source code   *
 * may be reproduced, adapted or transmitted in any form or *
 * by any means, electronic, mechanical, photocopying,      *
 * recording or otherwise.                                  *
 *                                                          *
 *----------------------------------------------------------*
 *                                                          *
 *                                                          *
 ************************************************************
 */

// copy of Kibana's ui/public/paginated_table/paginated_table.js
// but with the one-time binding removed from the scope columns object
// in the paginated_table.html template, to allow dynamic changes to
// the list of columns shown in the table.

import './row';

import "./styles/main.less";
import "ui/directives/paginate";
import "ui/styles/pagination.less";
import _ from 'lodash';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlPaginatedTable', function ($filter) {
  var orderBy = $filter('orderBy');

  return {
    restrict: 'E',
    template: require('./paginated_table.html'),
    transclude: true,
    scope: {
      rows: '=',
      columns: '=',
      perPage: '=?',
      sortHandler: '=?',
      showSelector: '=?'
    },
    controllerAs: 'prlPaginatedTable',
    controller: function ($scope) {
      var self = this;
      self.sort = {
        columnIndex: null,
        direction: null
      };

      self.sortColumn = function (colIndex) {
        var col = $scope.columns[colIndex];

        if (!col) return;
        if (col.sortable === false) return;

        var sortDirection;

        if (self.sort.columnIndex !== colIndex) {
          sortDirection = 'asc';
        } else {
          var directions = {
            null: 'asc',
            'asc': 'desc',
            'desc': null
          };
          sortDirection = directions[self.sort.direction];
        }

        self.sort.columnIndex = colIndex;
        self.sort.direction = sortDirection;
        self._setSortGetter(colIndex);
      };

      self._setSortGetter = function (index) {
        if (_.isFunction($scope.sortHandler)) {
          // use custom sort handler
          self.sort.getter = $scope.sortHandler(index);
        } else {
          // use generic sort handler
          self.sort.getter = function (row) {
            var value = row[index];
            if (value && value.value !== undefined && value.value !== null) {
              if (typeof value.value === "function") {
                return value.value();
              } else {
                return value.value;
              }
            } else {
              return value;
            }
          };
        }
      };

      // update the sortedRows result
      $scope.$watchMulti([
        'rows',
        'columns',
        '[]prlPaginatedTable.sort'
      ], function resortRows() {
        if (!$scope.rows || !$scope.columns) {
          $scope.sortedRows = false;
          return;
        }

        var sort = self.sort;
        if (sort.direction == null) {
          $scope.sortedRows = $scope.rows.slice(0);
        } else {
          $scope.sortedRows = orderBy($scope.rows, sort.getter, sort.direction === 'desc');
        }
      });
    }
  };
});
