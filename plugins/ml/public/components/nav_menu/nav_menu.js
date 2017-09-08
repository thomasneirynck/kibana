/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
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
import template from './nav_menu.html';
import uiRouter from 'ui/routes';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlNavMenu', function () {
  return {
    restrict: 'E',
    transclude: true,
    template,
    link: function (scope, el, attrs) {

      // Tabs
      scope.name = attrs.name;

      scope.showTabs = false;
      if (scope.name === 'jobs' ||
          scope.name === 'timeseriesexplorer' ||
          scope.name === 'explorer') {
        scope.showTabs = true;
      }
      scope.isActiveTab = function (path) {
        return scope.name === path;
      };

      // Breadcrumbs
      const crumbNames = {
        jobs: { label: 'Job Management', url: '#/jobs' },
        new_job: { label: 'Create New Job', url: '#/jobs/new_job' },
        single_metric: { label: 'Single Metric Job', url: '#/jobs/new_job/simple/single_metric' },
        multi_metric: { label: 'Multi Metric job', url: '#/jobs/new_job/simple/multi_metric' },
        advanced: { label: 'Advanced Job Configuration', url: '#/jobs/new_job/advanced' },
        explorer: { label: 'Anomaly Explorer', url: '#/explorer' },
        timeseriesexplorer: { label: 'Single Metric Viewer', url: '#/timeseriesexplorer' },
      };

      const breadcrumbs = [{ label: 'Machine Learning', url: '#/' }];

      // get crumbs from url
      const crumbs = uiRouter.getBreadcrumbs();
      _.each(crumbs, (crumb) => {
        breadcrumbs.push(crumbNames[crumb.id]);
      });
      scope.breadcrumbs = breadcrumbs.filter(Boolean);
    }
  };
});
