/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
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

import 'ui/courier';
import 'ui/config';
import 'ui/notify';
import 'ui/typeahead';
import 'ui/share';

import 'plugins/kibana/dashboard/grid';
import 'plugins/kibana/dashboard/panel/panel';
import 'plugins/kibana/dashboard/saved_dashboard/saved_dashboards';
import 'plugins/kibana/dashboard/styles/index.less';
import { savedDashboardRegister } from 'plugins/kibana/dashboard/saved_dashboard/saved_dashboard_register';
require('ui/saved_objects/saved_object_registry').register(savedDashboardRegister);

import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';

import './dashboard_app_directive';

import '../styles/main.less';

import 'plugins/kibana/visualize/saved_visualizations/saved_visualizations';
import 'plugins/kibana/discover/saved_searches/saved_searches';

uiModules.get('apps/ml', [
  'elasticsearch',
  'ngRoute',
  'kibana/courier',
  'kibana/config',
  'kibana/notify',
  'kibana/typeahead'
]);

uiRoutes
.defaults(/dashboard/, {
  requireDefaultIndex: true
})
.when('/anomalyexplorer', {
  template: require('./results_dashboard.html'),
  resolve: {
    dash: function (savedDashboards, Notifier, $route, $location, courier) {
      return savedDashboards.get('ml-explorer')
      .catch(courier.redirectWhenMissing({
        'dashboard' : '/dashboard'
      }));
    }
  }
})
.when('/connections', {
  template: require('./results_dashboard.html'),
  resolve: {
    dash: function (savedDashboards, Notifier, $route, $location, courier) {
      return savedDashboards.get('ml-connections')
      .catch(courier.redirectWhenMissing({
        'dashboard' : '/dashboard'
      }));
    }
  }
});

