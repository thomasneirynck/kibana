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

/*
 * dashboard-app directive used for displaying pre-built Kibana dashboards inside
 * the Machine Learning plugin. Based on the dashboard-app directive from the dashboard view
 * of the standard Kibana plugin.
 */

import _ from 'lodash';
import angular from 'angular';
import uiModules from 'ui/modules';
import chrome from 'ui/chrome';

//include the bootstrap patch for better popovers
import 'plugins/ml/lib/angular_bootstrap_patch';

import 'plugins/kibana/dashboard/grid';
import 'plugins/kibana/dashboard/panel/panel';

import 'plugins/kibana/discover/styles/main.less';
import 'plugins/kibana/dashboard/styles/index.less';
import '../styles/main.less';

import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import DocTitleProvider from 'ui/doc_title';
import { DashboardConstants } from 'plugins/kibana/dashboard/dashboard_constants';
import UtilsBrushEventProvider from 'ui/utils/brush_event';
import FilterBarFilterBarClickHandlerProvider from 'ui/filter_bar/filter_bar_click_handler';
import { DashboardState } from 'plugins/kibana/dashboard/dashboard_state';

import 'plugins/ml/components/job_select_list';

const module = uiModules.get('apps/ml');

module.directive('dashboardApp', function (Notifier, courier, AppState, timefilter, quickRanges, kbnUrl, Private) {
  const brushEvent = Private(UtilsBrushEventProvider);
  const filterBarClickHandler = Private(FilterBarFilterBarClickHandlerProvider);

  return {
    restrict: 'E',
    template: require('plugins/ml/results/components/dashboard_app.html'),
    controllerAs: 'dashboardApp',
    controller: function ($scope, $rootScope, $route, $routeParams, $location, getAppState, mlDashboardService) {
      const queryFilter = Private(FilterBarQueryFilterProvider);
      const docTitle = Private(DocTitleProvider);
      const notify = new Notifier({ location: 'Dashboard' });

      const dash = $scope.dash = $route.current.locals.dash;
      if (dash.id) {
        docTitle.change(dash.title);
      }

      mlDashboardService.listenJobSelectionChange($scope, function (event, selections) {
        const selectedJobIds = selections.length > 0 ? selections : ['*'];
        $scope.selectedJobs = _.map(selectedJobIds, function (jobId) {
          return { id:jobId };
        });
        buildSelectedJobObjects(selectedJobIds);

        if (selections.length > 0) {
          $location.search('jobId', selections);
        }

        $scope.filterResults();
      });

      const dashboardState = new DashboardState(
        dash,
        timefilter,
        !getAppState.previouslyStored(),
        quickRanges,
        AppState);

      //  Populate the Job picker, looking to see if a jobId(s) has been passed in the URL.
      let selectedJobIds = ['*'];
      const urlSearch = $location.search();
      if (_.has(urlSearch, 'jobId')) {
        const jobIdParam = urlSearch.jobId;
        if (_.isArray(jobIdParam) === true) {
          selectedJobIds = jobIdParam;
        } else {
          selectedJobIds = [jobIdParam];
        }
      }

      $scope.selectedJobs = _.map(selectedJobIds, function (jobId) {
        return { id:jobId };
      });

      buildSelectedJobObjects(selectedJobIds);


      $scope.updateDashboardFilters = function () {
        // Add a custom updateDashboardFilters function, which performs the same role
        // as plugins/kibana/dashboard/dashboard_state updateFilters(), but adds in
        // an extra filter for the job IDs set in the job picker.
        const filters = queryFilter.getFilters();

        let jobIdFilters = [];
        if ($scope.selectedJobs) {
          let jobIdFilterStr = '';
          _.each($scope.selectedJobs, function (job, i) {
            if (i > 0) {
              jobIdFilterStr += ' OR ';
            }
            jobIdFilterStr += 'job_id:';
            jobIdFilterStr += job.id;
          });
          jobIdFilters = [{ query: { query_string:{ analyze_wildcard:true, query:jobIdFilterStr } } }];
        }

        if (dashboardState.appState.query) {
          dash.searchSource.set('filter', _.union(filters, [{
            query: dashboardState.appState.query
          }], jobIdFilters));
        } else {
          dash.searchSource.set('filter', _.union(filters, jobIdFilters));
        }

        dashboardState.saveState();
      };

      $scope.updateDashboardFilters();

      let pendingVisCount = _.size(dashboardState.getPanels());

      timefilter.enabled = true;
      courier.setRootSearchSource(dash.searchSource);

      // Following the "best practice" of always have a '.' in your ng-models –
      // https://github.com/angular/angular.js/wiki/Understanding-Scopes
      $scope.model = { query: dashboardState.getQuery() };

      $scope.panels = dashboardState.getPanels();
      $scope.refresh = _.bindKey(courier, 'fetch');
      $scope.timefilter = timefilter;
      $scope.expandedPanel = null;

      $scope.getBrushEvent = () => brushEvent(dashboardState.getAppState());
      $scope.getFilterBarClickHandler = () => filterBarClickHandler(dashboardState.getAppState());
      $scope.hasExpandedPanel = () => $scope.expandedPanel !== null;
      $scope.getDashTitle = () => {
        return dashboardState.dashboard.lastSavedTitle || `${dashboardState.dashboard.title} (unsaved)`;
      };
      $scope.newDashboard = () => { kbnUrl.change(DashboardConstants.CREATE_NEW_DASHBOARD_URL, {}); };
      $scope.saveState = () => dashboardState.saveState();

      $scope.toggleExpandPanel = (panelIndex) => {
        if ($scope.expandedPanel && $scope.expandedPanel.panelIndex === panelIndex) {
          $scope.expandedPanel = null;
        } else {
          $scope.expandedPanel =
            dashboardState.getPanels().find((panel) => panel.panelIndex === panelIndex);
        }
      };

      $scope.filterResults = function () {
        dashboardState.setQuery($scope.model.query);
        $scope.updateDashboardFilters();
        $scope.refresh();
      };

      // called by the saved-object-finder when a user clicks a vis
      $scope.addVis = function (hit) {
        pendingVisCount++;
        dashboardState.addNewPanel(hit.id, 'visualization');
      };

      $scope.addSearch = function (hit) {
        pendingVisCount++;
        dashboardState.addNewPanel(hit.id, 'search');
      };

      /**
       * Creates a child ui state for the panel. It's passed the ui state to use, but needs to
       * be generated from the parent (why, I don't know yet).
       * @param path {String} - the unique path for this ui state.
       * @param uiState {Object} - the uiState for the child.
       * @returns {Object}
       */
      $scope.createChildUiState = function createChildUiState(path, uiState) {
        return dashboardState.uiState.createChild(path, uiState, true);
      };

      $scope.onPanelRemoved = (panelIndex) => dashboardState.removePanel(panelIndex);

      $scope.save = function () {
        return dashboardState.saveDashboard(angular.toJson).then(function (id) {
          $scope.kbnTopNav.close('save');
          if (id) {
            notify.info(`Saved Dashboard as "${dash.title}"`);
            if (dash.id !== $routeParams.id) {
              kbnUrl.change(
                `${DashboardConstants.EXISTING_DASHBOARD_URL}`,
                { id: dash.id });
            } else {
              docTitle.change(dash.lastSavedTitle);
            }
          }
        }).catch(notify.fatal);
      };

      $scope.$watchCollection(() => dashboardState.getOptions(), () => dashboardState.saveState());
      $scope.$watch(() => dashboardState.getOptions().darkTheme, updateTheme);

      $scope.$watch('model.query', function () {
        dashboardState.setQuery($scope.model.query);
      });

      $scope.$listen(timefilter, 'fetch', $scope.refresh);

      // update root source when filters update
      $scope.$listen(queryFilter, 'update', function () {
        $scope.updateDashboardFilters();
      });

      // update data when filters fire fetch event
      $scope.$listen(queryFilter, 'fetch', $scope.refresh);

      $scope.$on('$destroy', () => {
        dashboardState.destroy();

        // Remove dark theme to keep it from affecting the appearance of other apps.
        setLightTheme();
      });

      function buildSelectedJobObjects(selectedIds) {
        // Build scope objects used in the HTML template.
        $scope.unsafeHtml = '<ml-job-select-list selected="' + selectedIds.join(' ') + '"></ml-job-select-list>';

        // Crop long job IDs for display in the button text.
        // The first full job ID is displayed in the tooltip.
        let firstJobId = selectedIds[0];
        if (selectedIds.length > 1 && firstJobId.length > 22) {
          firstJobId = firstJobId.substring(0, 19) + '...';
        }
        $scope.selectJobBtnJobIdLabel = firstJobId;
      }

      function updateTheme() {
        const useDarkTheme = dashboardState.getOptions().darkTheme;
        useDarkTheme ? setDarkTheme() : setLightTheme();
      }

      function setDarkTheme() {
        chrome.removeApplicationClass(['theme-light']);
        chrome.addApplicationClass('theme-dark');
      }

      function setLightTheme() {
        chrome.removeApplicationClass(['theme-dark']);
        chrome.addApplicationClass('theme-light');
      }

      $scope.$on('ready:vis', function () {
        if (pendingVisCount > 0) pendingVisCount--;
        if (pendingVisCount === 0) {
          dashboardState.saveState();
          $scope.refresh();
        }
      });

      // Setup configurable values for config directive, after objects are initialized
      $scope.opts = {
        dashboard: dash,
        ui: dashboardState.getOptions(),
        save: $scope.save,
        addVis: $scope.addVis,
        addSearch: $scope.addSearch,
        timefilter: $scope.timefilter
      };

      $scope.$emit('application.load');
    }
  };
});
