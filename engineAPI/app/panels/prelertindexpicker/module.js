/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2014     *
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
 * on +44 (0)20 7953 7243 or email to legal@prelert.com.    *
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

/**
 * Prototype Prelert control for a selector from the list of Elasticsearch indices.
 */
define([
  'angular',
  'app',
  'lodash',
  'kbn'
],
function (angular, app, _, kbn) {
  'use strict';

  var module = angular.module('kibana.panels.prelertindexpicker', []);
  app.useModule(module);

  module.controller('prelertindexpicker', function($scope, $modal, $q) {
    $scope.panelMeta = {
      status  : "Stable",
      description : "A panel for selecting the Elasticsearch index being queried."
    };
    
    // Set and populate defaults
    var _d = {
      title         : "Index Picker",
      status        : "Stable",
      /**
       * label:: Label to show next to the index picker control.
       */
      label : 'Index:',
      /**
       * omit_indices:: List of indices to omit from the available selection in the dropdown control.
       */
      omit_indices  : ['kibana-int', 'prelert-int'],
      /**
       * showAll:: Set to false to hide the 'All' options from the indices dropdown.
       */
      showAll  : true,
      /**
       * showAllLabel:: Label to display for the 'All indices' option in the drop control.
       */
      showAllLabel  : 'All indices'
    };
    _.defaults($scope.panel,_d);


    $scope.$on('refresh', function(){$scope.init();});

    $scope.init = function() {
        // Obtain the list of Elasticsearch indices.
        $scope.index_names = [];
        $scope.get_indexes();
    };
    
    $scope.get_indexes = function() {
        // Need to use the get() function of the elasticsearch jQuery client
        // as the default doSearch() function uses a POST request and 
        // the _stats index can only be accessed via a GET.
        var indicesCallback = function(results) {
            var indicesObject = results.indices;
            var indices = _.keys(indicesObject);
            $scope.index_names = _.sortBy(indices, _.identity);   
            console.log("prelertindexpicker list of indices:");
            console.log($scope.index_names);
            
            var currentIndex = $scope.dashboard.current.index.default;
            
            // Default to the first index in the list if a current index is not set.
            if ( (_.isUndefined(currentIndex) || _.isEmpty(currentIndex)) &&  (_.size($scope.index_names) > 0) ) {
                $scope.setIndex(_.first($scope.index_names));
            }
        };
        
        var errorCallback = function() {
            $scope.index_names = [];
            console.error("Error requesting list of Elasticsearch indices");
            alert("An error occurred obtaining the list of Elasticsearch indices");
        };
        $scope.ejs.client.get('/_stats/indices', {}, indicesCallback, errorCallback);
    };
    
    $scope.notInOmitList = function(index) {
        return !_.contains($scope.panel.omit_indices, index);
    };

    $scope.setIndex = function(index) {
        if ($scope.dashboard.current.index.default != index) {
            $scope.dashboard.current.index.default = index;
            $scope.dashboard.refresh();
        }
    };

  });
});
