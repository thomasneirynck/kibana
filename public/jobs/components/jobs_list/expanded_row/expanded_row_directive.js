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
import moment from 'moment';
import stringUtils from 'plugins/prelert/util/string_utils';
import numeral from 'numeral';
import chrome from 'ui/chrome';
import angular from 'angular';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlJobListExpandedRow', function ($location, prlMessageBarService, prlJobService, prlClipboardService) {
  return {
    restrict: 'AE',
    replace: false,
    scope: {},
    template: require('plugins/prelert/jobs/components/jobs_list/expanded_row/expanded_row.html'),
    link: function ($scope, $element, $attrs) {
      const msgs = prlMessageBarService; // set a reference to the message bar service

      $scope.urlBasePath = chrome.getBasePath();

      $scope.toLocaleString = stringUtils.toLocaleString; // add toLocaleString to the scope to display nicer numbers

      // scope population is inside a function so it can be called later from somewhere else
      // for example, after data has been uploaded, the expanded row can be updated
      $scope.init = function () {
        $scope.job = $scope.$parent.job;
        $scope.jobAudit = $scope.$parent.jobAudit;
        $scope.jobJson = angular.toJson($scope.job, true);
        $scope.jobAuditText = '';

        $scope.detectorToString = stringUtils.detectorToString;

        $scope.ui = {
          currentTab: 0,
          tabs: [
            { index: 0, title: 'Job settings' },
            { index: 1, title: 'Job config' },
            { index: 3, title: 'Counts' },
            { index: 4, title: 'JSON' },
            { index: 6, title: 'Job Messages' , showIcon: true },
          ],
          changeTab: function (tab) {
            this.currentTab = tab.index;

            if (tab.index === 6) {
              // when Job Message tab is clicked, load all the job messages for the last month
              // use the promise chain returned from update to scroll to the bottom of the
              // list once it's loaded
              $scope.jobAudit.update().then(() => {
                // auto scroll to the bottom of the message list.
                const div = angular.element('#prl-job-audit-list-' + $scope.job.id);
                if (div && div.length) {
                  // run this asynchronously in a timeout to allow angular time to render the contents first
                  window.setTimeout(() => {
                    const table = div.find('table');
                    if (table && table.length) {
                      div[0].scrollTop = table[0].offsetHeight - div[0].offsetHeight + 14;
                    }
                  }, 0);
                }
              });
            }
          }
        };

        if (typeof $scope.job.schedulerConfig !== 'undefined') {
          $scope.ui.tabs.splice(2, 0, { index: 2, title: 'Scheduler' });
        }

        if ($scope.job.counts.inputRecordCount === 0 &&
           typeof $scope.job.schedulerConfig === 'undefined') {
          $scope.ui.tabs.splice(4, 0, { index: 5, title: 'Upload Data'});
        }

        // replace localhost in any of the job's urls with the host in the browser's address bar
        if ($scope.job.location) {
          $scope.job.location = replaceHost($scope.job.location);
        }
        if ($scope.job.endpoints) {
          _.each($scope.job.endpoints, (url, i) => {
            $scope.job.endpoints[i] = replaceHost(url);
          });
        }
      };

      // call function defined above.
      $scope.init();

      $scope.copyToClipboard = function (job) {
        let newJob = angular.copy(job, newJob);
        newJob = prlJobService.removeJobEndpoints(newJob);
        newJob = prlJobService.removeJobCounts(newJob);

        let success = prlClipboardService.copy(angular.toJson(newJob));
        if (success) {
          // msgs.clear();
          // msgs.info(job.id+' JSON copied to clipboard');

          // flash the background color of the json box
          // to show the contents has been copied.
          const el = $element.find('.prl-pre');
          el.css('transition', 'none');
          el.css('background-color', 'aliceblue');
          el.css('color', 'white');
          window.setTimeout(() => {
            // el.css('transition', 'background 0.3s linear');
            el.css('transition', 'background 0.3s linear, color 0.3s linear');
            el.css('background-color', 'white');
            el.css('color', 'inherit');
          }, 1);

        } else {
          msgs.error('Job could not be copied to the clipboard');
        }
      };

      // data values should be formatted with KB, MB etc
      $scope.formatData = function (txt) {
        return numeral(txt).format('0.0 b');
      };

      // milliseconds should be formatted h m s ms, e.g 3s 44ms
      $scope.formatMS = function (txt) {
        const dur = moment.duration(txt);
        let str = '';
        if (dur._data.days > 0) {
          str += ' ' + dur._data.days + 'd';
        }
        if (dur._data.hours > 0) {
          str += ' ' + dur._data.hours + 'h';
        }
        if (dur._data.minutes > 0) {
          str += ' ' + dur._data.minutes + 'm';
        }
        if (dur._data.seconds > 0) {
          str += ' ' + dur._data.seconds + 's';
        }
        if (dur._data.milliseconds > 0) {
          str += ' ' + Math.ceil(dur._data.milliseconds) + 'ms';
        }
        return str;
      };

      function replaceHost(url) {
        if (url.match('localhost')) {
          url = url.replace('localhost', $location.host());
        }
        return url;
      }

    },
  };
})
// custom filter to filter out objects from a collection
// used when listing job settings, as id and status are siblings to objects like counts and dataDescription
.filter('filterObjects', function () {
  return function (input) {
    const tempObj = {};
    _.each(input, (v,i) => {
      if (typeof v !== 'object') {
        tempObj[i] = v;
      }
    });
    return tempObj;
  };
});

