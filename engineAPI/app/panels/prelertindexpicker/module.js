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
      status        : "Stable",
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
            indices = _.sortBy(indices, _.identity);
            // TODO - make it an option in the editor to hide particular indices.
            // For now, just remove the internal Kibana and Prelert indexes.
            $scope.index_names = _.without(indices, 'kibana-int', 'prelert-int');
            console.log("prelertindexpicker list of indices:");
            console.log($scope.index_names);
        };
        
        var errorCallback = function() {
            $scope.index_names = [];
            console.error("Error requesting list of Elasticsearch indices");
            alert("An error occurred obtaining the list of Elasticsearch indices");
        };
        $scope.ejs.client.get('/_stats/indices', {}, indicesCallback, errorCallback);
    };

    $scope.setIndex = function(index) {
      $scope.dashboard.current.index.default = index;
      $scope.dashboard.refresh();
    };

  });
});
