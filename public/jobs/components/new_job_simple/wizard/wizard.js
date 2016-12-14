/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright © 2016 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import _ from 'lodash';
// import moment from 'moment-timezone';
// import stringUtils from 'plugins/prelert/util/string_utils';
// import 'plugins/prelert/lib/minify.json';
import 'ui/courier';

// import 'plugins/kibana/visualize/saved_visualizations/saved_visualizations';
// import 'ui/directives/saved_object_finder';
// import 'ui/directives/paginated_selectable_list';
// import 'plugins/kibana/discover/saved_searches/saved_searches';

// import 'plugins/prelert/services/visualization_job_service';
import 'plugins/kibana/visualize/styles/main.less';
// /Users/james/dev/kibana-5.0/src/core_plugins/kibana/public/visualize/styles/main.less

import uiRoutes from 'ui/routes';
uiRoutes
.when('/jobs/new_job_simple/step/1', {
  template: require('./step_1.html'),
  resolve: {
    indexPatternIds: courier => courier.indexPatterns.getIds()
  }
});

// preloading

// require('ui/saved_objects/saved_object_registry')
// .register(require('plugins/kibana/visualize/saved_visualizations/saved_visualization_register'));

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlNewJobStep1', (
  $scope,
  $route,
  timefilter) => {

  timefilter.enabled = false; // remove time picker from top of page

  $scope.indexPattern = {
    selection: null,
    list: $route.current.locals.indexPatternIds
  };

  $scope.step2WithSearchUrl = (hit) => {
    // return kbnUrl.eval('#/visualize/create?&type={{type}}&savedSearchId={{id}}', {type: type, id: hit.id});
    return '';
  };
  $scope.makeUrl = (pattern) => {
    if (!pattern) return;
    return '#/jobs/new_job_simple/create?index=' + encodeURIComponent(pattern);
  };
});
