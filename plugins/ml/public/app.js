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

import 'plugins/ml/jobs/index';
import 'plugins/ml/results/index';
import 'plugins/ml/support/index';
import 'plugins/ml/services/ml_clipboard_service';
import 'plugins/ml/services/info_service';
import 'plugins/ml/services/job_service';
import 'plugins/ml/services/browser_detect_service';
import 'plugins/ml/services/ml_dashboard_service';
import 'plugins/ml/services/results_service';
import 'plugins/ml/messagebar';
import 'plugins/ml/summaryview';
import 'plugins/ml/explorer';
import 'plugins/ml/timeseriesexplorer';
import 'plugins/ml/components/json_tooltip';
import 'plugins/ml/components/engine_api_help_link';
import 'plugins/ml/components/confirm_modal';
import 'plugins/ml/app.less';
import 'plugins/ml/components/pretty_duration';

import chrome from 'ui/chrome';
import routes from 'ui/routes';

// switch the kibana favicon to the ml icon
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
.setRootController('ml', function ($scope, $rootScope, kbnUrl) {

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
    key: 'explorer',
    description: 'Explorer2',
    label: 'Explorer2',
    run: function () { kbnUrl.change('/explorer', {});}
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
