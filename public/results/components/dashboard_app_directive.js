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

/*
 * dashboard-app directive used for displaying pre-built Kibana dashboards inside
 * the Prelert plugin. Based on the dashboard-app directive from the dashboard view
 * of the standard Kibana plugin.
 */

import _ from 'lodash';
import $ from 'jquery';
import chrome from 'ui/chrome';

//include the bootstrap patch for better popovers
import 'plugins/prelert/lib/angular_bootstrap_patch';

import 'ui/courier';
import 'ui/notify';

import 'ui/listen';
import DocTitleProvider from 'ui/doc_title';

import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';

import stateMonitorFactory  from 'ui/state_management/state_monitor_factory';

import 'plugins/kibana/dashboard/directives/grid';
import 'plugins/kibana/dashboard/components/panel/panel';
import 'plugins/kibana/dashboard/services/saved_dashboards';
import 'plugins/kibana/discover/styles/main.less';
import 'plugins/kibana/dashboard/styles/main.less';
import '../styles/main.less';

import 'plugins/prelert/components/job_select_list';
import 'plugins/prelert/components/log_usage';


import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('dashboardApp', function (Notifier, courier, AppState, timefilter, kbnUrl) {
  return {
    restrict: 'E',
    template: require('plugins/prelert/results/components/dashboard_app.html'),
    controllerAs: 'dashboardApp',
    controller: function ($scope, $rootScope, $route, $routeParams, $location, Private, getAppState, prlDashboardService) {

      const queryFilter = Private(FilterBarQueryFilterProvider);

      const notify = new Notifier({
        location: 'Dashboard'
      });

      const dash = $scope.dash = $route.current.locals.dash;

      if (dash.timeRestore && dash.timeTo && dash.timeFrom && !getAppState.previouslyStored()) {
        timefilter.time.to = dash.timeTo;
        timefilter.time.from = dash.timeFrom;
        if (dash.refreshInterval) {
          timefilter.refreshInterval = dash.refreshInterval;
        }
      }

      prlDashboardService.listenJobSelectionChange($scope, function(event, selections){
        var selectedJobIds = selections.length > 0 ? selections : ['*'];
        $scope.selectedJobs = _.map(selectedJobIds, function(jobId){
            return {id:jobId};
        });
        buildSelectedJobObjects(selectedJobIds);

        if (selections.length > 0) {
            $location.search('jobId', selections);
        }

        $scope.filterResults();
      });

      $scope.$on('$destroy', dash.destroy);

      const matchQueryFilter = function (filter) {
        return filter.query && filter.query.query_string && !filter.meta;
      };

      const extractQueryFromFilters = function (filters) {
        const filter = _.find(filters, matchQueryFilter);
        if (filter) return filter.query;
      };

      const stateDefaults = {
        title: dash.title,
        panels: dash.panelsJSON ? JSON.parse(dash.panelsJSON) : [],
        options: dash.optionsJSON ? JSON.parse(dash.optionsJSON) : {},
        uiState: dash.uiStateJSON ? JSON.parse(dash.uiStateJSON) : {},
        query: extractQueryFromFilters(dash.searchSource.getOwn('filter')) || {query_string: {query: '*'}},
        filters: _.reject(dash.searchSource.getOwn('filter'), matchQueryFilter),
      };

      let stateMonitor;
      const $state = $scope.state = new AppState(stateDefaults);
      const $uiState = $scope.uiState = $state.makeStateful('uiState');
      const $appStatus = $scope.appStatus = this.appStatus = {};

      $scope.$watchCollection('state.options', function (newVal, oldVal) {
        if (!angular.equals(newVal, oldVal)) $state.save();
      });
      $scope.$watch('state.options.darkTheme', setDarkTheme);

      $scope.refresh = _.bindKey(courier, 'fetch');

      timefilter.enabled = true;
      $scope.timefilter = timefilter;
      $scope.$listen(timefilter, 'fetch', $scope.refresh);

      courier.setRootSearchSource(dash.searchSource);

      function init() {
        // Look to see if a jobId(s) has been passed in the URL.
        var selectedJobIds = ['*'];
        var urlSearch = $location.search();
        if (_.has(urlSearch, 'jobId')) {
          var jobIdParam = urlSearch.jobId;
          if (_.isArray(jobIdParam) == true) {
              selectedJobIds = jobIdParam;
          } else {
              selectedJobIds = [jobIdParam];
          }
        }

        $scope.selectedJobs = _.map(selectedJobIds, function(jobId){
          return {id:jobId};
        });
        console.log("dashboard_app_directive, selectedJobIds:", $scope.selectedJobs);
        buildSelectedJobObjects(selectedJobIds);

        updateQueryOnRootSource();

        const docTitle = Private(DocTitleProvider);
        if (dash.id) {
          docTitle.change(dash.title);
        }

        initPanelIndices();

        // watch for state changes and update the appStatus.dirty value
        stateMonitor = stateMonitorFactory.create($state, stateDefaults);
        stateMonitor.onChange((status) => {
          $appStatus.dirty = status.dirty;
        });
        $scope.$on('$destroy', () => stateMonitor.destroy());

        $scope.$emit('application.load');
      }

      function initPanelIndices() {
        // find the largest panelIndex in all the panels
        let maxIndex = getMaxPanelIndex();

        // ensure that all panels have a panelIndex
        $scope.state.panels.forEach(function (panel) {
          if (!panel.panelIndex) {
            panel.panelIndex = maxIndex++;
          }
        });
      }

      function getMaxPanelIndex() {
        let index = $scope.state.panels.reduce(function (idx, panel) {
          // if panel is missing an index, add one and increment the index
          return Math.max(idx, panel.panelIndex || idx);
        }, 0);
        return ++index;
      }

      function updateQueryOnRootSource() {
        const filters = queryFilter.getFilters();

        var jobIdFilters = [];
        if ($scope.selectedJobs) {
          var jobIdFilterStr = "";
          _.each($scope.selectedJobs, function(job, i){
            if (i > 0) {
              jobIdFilterStr += " OR ";
            }
            jobIdFilterStr += "jobId:";
            jobIdFilterStr += job.id;
          });
          jobIdFilters = [{query: {query_string:{analyze_wildcard:true, query:jobIdFilterStr}}}];
        }

        if ($state.query) {
          dash.searchSource.set('filter', _.union(filters, [{
            query: $state.query
          }], jobIdFilters));

        } else {
          dash.searchSource.set('filter', filters);
        }
      }

      function buildSelectedJobObjects(selectedJobIds) {
        // Build scope objects used in the HTML template.
        $scope.unsafeHtml = '<prl-job-select-list selected="' + selectedJobIds.join(' ') + '"></prl-job-select-list>';

        // Crop long job IDs for display in the button text.
        // The first full job ID is displayed in the tooltip.
        var firstJobId = selectedJobIds[0];
        if (selectedJobIds.length > 1 && firstJobId.length > 22) {
          firstJobId = firstJobId.substring(0, 19) + "...";
        }
        $scope.selectJobBtnJobIdLabel = firstJobId;
      }

      function setDarkTheme(enabled) {
        const theme = Boolean(enabled) ? 'theme-dark' : 'theme-light';
        chrome.removeApplicationClass(['theme-dark', 'theme-light']);
        chrome.addApplicationClass(theme);
      }

      // update root source when filters update
      $scope.$listen(queryFilter, 'update', function () {
        updateQueryOnRootSource();
        $state.save();
      });

      // update data when filters fire fetch event
      $scope.$listen(queryFilter, 'fetch', $scope.refresh);

      $scope.newDashboard = function () {
        kbnUrl.change('/dashboard', {});
      };

      $scope.filterResults = function () {
        updateQueryOnRootSource();
        $state.save();
        $scope.refresh();
      };

      $scope.save = function () {
        $state.title = dash.id = dash.title;
        $state.save();

        const timeRestoreObj = _.pick(timefilter.refreshInterval, ['display', 'pause', 'section', 'value']);
        dash.panelsJSON = angular.toJson($state.panels);
        dash.uiStateJSON = angular.toJson($uiState.getChanges());
        dash.timeFrom = dash.timeRestore ? timefilter.time.from : undefined;
        dash.timeTo = dash.timeRestore ? timefilter.time.to : undefined;
        dash.refreshInterval = dash.timeRestore ? timeRestoreObj : undefined;
        dash.optionsJSON = angular.toJson($state.options);

        dash.save()
        .then(function (id) {
          stateMonitor.setInitialState($state.toJSON());
          $scope.kbnTopNav.close('save');
          if (id) {
            notify.info('Saved Dashboard as "' + dash.title + '"');
            if (dash.id !== $routeParams.id) {
              kbnUrl.change('/dashboard/{{id}}', {id: dash.id});
            }
          }
        })
        .catch(notify.fatal);
      };

      let pendingVis = _.size($state.panels);
      $scope.$on('ready:vis', function () {
        if (pendingVis) pendingVis--;
        if (pendingVis === 0) {
          $state.save();
          $scope.refresh();
        }
      });

      // listen for notifications from the grid component that changes have
      // been made, rather than watching the panels deeply
      $scope.$on('change:vis', function () {
        $state.save();
      });

      // called by the saved-object-finder when a user clicks a vis
      $scope.addVis = function (hit) {
        pendingVis++;
        $state.panels.push({ id: hit.id, type: 'visualization', panelIndex: getMaxPanelIndex() });
      };

      $scope.addSearch = function (hit) {
        pendingVis++;
        $state.panels.push({ id: hit.id, type: 'search', panelIndex: getMaxPanelIndex() });
      };

      // Setup configurable values for config directive, after objects are initialized
      $scope.opts = {
        dashboard: dash,
        ui: $state.options,
        save: $scope.save,
        addVis: $scope.addVis,
        addSearch: $scope.addSearch,
        timefilter: $scope.timefilter
      };

      init();
    }
  };
});
