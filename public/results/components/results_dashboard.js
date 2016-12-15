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

import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';
import chrome from 'ui/chrome';
import 'ui/courier';
import 'ui/config';
import 'ui/notify';
import 'ui/typeahead';
import 'ui/share';
import 'plugins/kibana/dashboard/directives/grid';
import 'plugins/kibana/dashboard/directives/dashboard_panel';

import 'plugins/kibana/dashboard/services/saved_dashboards';
import 'plugins/kibana/dashboard/styles/main.less';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import DocTitleProvider from 'ui/doc_title';
import stateMonitorFactory  from 'ui/state_management/state_monitor_factory';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';

import './dashboard_app_directive';

import '../styles/main.less';

import savedObjectRegistry from 'ui/saved_objects/saved_object_registry';
savedObjectRegistry.register(require('plugins/kibana/dashboard/services/saved_dashboard_register'));

import 'plugins/kibana/visualize/saved_visualizations/saved_visualizations';
import 'plugins/kibana/discover/saved_searches/saved_searches';

const module = uiModules.get('apps/prelert', [
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
      return savedDashboards.get('Explorer')
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
      return savedDashboards.get('Connections')
      .catch(courier.redirectWhenMissing({
        'dashboard' : '/dashboard'
      }));
    }
  }
});

