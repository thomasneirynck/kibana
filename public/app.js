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
import 'ui-bootstrap';
import 'ui/persisted_log';
import 'ui/autoload/all';

import 'plugins/prelert/jobs/index';
import 'plugins/prelert/results/index';
import 'plugins/prelert/support/index';
import 'plugins/prelert/services/prelert_angular_client';
import 'plugins/prelert/services/prelert_clipboard_service';
import 'plugins/prelert/services/server_request_service';
import 'plugins/prelert/services/info_service';
import 'plugins/prelert/services/job_service';
import 'plugins/prelert/services/browser_detect_service';
import 'plugins/prelert/services/prelert_dashboard_service';
import 'plugins/prelert/services/results_service';
import 'plugins/prelert/messagebar';
import 'plugins/prelert/summaryview';
import 'plugins/prelert/timeseriesexplorer';
import 'plugins/prelert/components/json_tooltip';
import 'plugins/prelert/components/engine_api_help_link';
import 'plugins/prelert/components/confirm_modal';
import 'plugins/prelert/app.less';
import 'plugins/prelert/components/pretty_duration';

import moment from 'moment-timezone';

import chrome from 'ui/chrome';
import routes from 'ui/routes';
import modules from 'ui/modules';

import logo from 'plugins/prelert/header.png';
import favicon from 'plugins/prelert/favicon.png';

// switch the kibana favicon to the prelert icon
// $("head link[rel='shortcut icon']").attr("href", favicon);

// From Kibana 4.4+, plugins are required to explicitly enable AngularJS routing,
// via the enable() function added to ui/public/routes/routes.js
// See https://github.com/elastic/kibana/issues/5226
// and https://github.com/elastic/kibana/pull/5271
if (typeof routes.enable === 'function') {
  routes.enable();
}

routes
.otherwise({
  redirectTo: `/${chrome.getInjected('kbnDefaultAppId', 'jobs')}`
});

chrome
.setRootController('prelert', function ($scope, $rootScope, kbnUrl) {

  $scope.topNavMenu = [{
    key: 'jobs',
    description: 'Jobs',
    label: 'Jobs',
    run: function () { kbnUrl.change('/jobs', {});}
  }, {
    key: 'summaryview',
    description: 'Summary view',
    label: 'Summary view',
    run: function () { kbnUrl.change('/summaryview', {});}
  }, {
    key: 'anomalyexplorer',
    description: 'Explorer',
    label: 'Explorer',
    run: function () { kbnUrl.change('/anomalyexplorer', {});}
  }, {
    key: 'timeseriesexplorer',
    description: 'Time series',
    label: 'Time series',
    run: function () { kbnUrl.change('/timeseriesexplorer', {});}
  }, {
    key: 'connections',
    description: 'Connections',
    label: 'Connections',
    run: function () { kbnUrl.change('/connections', {});}
  }, {
    key: 'support',
    description: 'Support',
    label: 'Support',
    run: function () { kbnUrl.change('/support', {});}
  }];

});
