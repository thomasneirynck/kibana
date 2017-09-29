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

 /*
  * Angular controller for the modal dialog which allows the
  * user to run and view time series forecasts.
  */

import _ from 'lodash';
import moment from 'moment';

import './styles/main.less';

import { parseInterval } from 'ui/utils/parse_interval';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlForecastingModal', function (
  $scope,
  $interval,
  $modalInstance,
  $modal,
  params,
  mlForecastService,
  mlJobService,
  mlMessageBarService) {

  $scope.newForecastDuration = '1d';
  $scope.newForecastDurationValid = true;
  $scope.isForecastRunning = false;
  $scope.showFrom = params.earliest;
  $scope.previousForecasts = [];

  const job = params.job;
  const detectorIndex = params.detectorIndex;
  const entities = params.entities;
  const loadForForecastId = params.pscope.loadForForecastId;
  let forecastChecker = null;

  const FORECASTS_VIEW_MAX = 5;       // Display links to a maximum of 5 forecasts.

  const msgs = mlMessageBarService;
  msgs.clear();

  // TODO - only enable forecasts to be run if the user has the manage_ml role.
  $scope.enableRunForecast = (job.state === 'opened' || job.state === 'closed');

  // List of all the forecasts with results at or later than the specified 'from' time.
  mlForecastService.getForecastsSummary(job, $scope.showFrom, FORECASTS_VIEW_MAX)
    .then((resp) => {
      resp.forecasts.forEach((forecast) => {
        // Format run time of forecast just down to HH:mm
        forecast.runTime = moment(forecast.id).format('MMMM Do YYYY, HH:mm');
        forecast.earliestTime = moment(forecast.earliest).format('MMMM Do YYYY, HH:mm:ss');
        forecast.latestTime = moment(forecast.latest).format('MMMM Do YYYY, HH:mm:ss');
      });

      $scope.previousForecasts = resp.forecasts;
    })
    .catch((resp) => {
      console.log('Time series forecast modal - error obtaining forecasts summary:', resp);
      msgs.error('Error obtaining list of previous forecasts.', resp);
    });

  $scope.viewForecast = function (forecastId) {
    loadForForecastId(forecastId);
    $scope.close();
  };

  $scope.newForecastDurationChange = function () {
    $scope.newForecastDurationValid = true;
    if(parseInterval($scope.newForecastDuration) === null) {
      $scope.newForecastDurationValid = false;
    }
  };

  $scope.checkJobStateAndRunForecast = function () {
    // Checks the job state, opening a job if closed, then runs the forecast.
    msgs.clear();

    $scope.isForecastRunning = true;

    // A forecast can only be run on an opened job,
    // so open job if it is closed.
    if (job.state === 'closed') {
      openJobAndRunForecast();
    } else {
      runForecast(false);
    }
  };

  $scope.close = function () {
    msgs.clear();
    $modalInstance.close();
  };

  $scope.$on('$destroy', () => {
    if (forecastChecker !== null) {
      $interval.cancel(forecastChecker);
    }
  });

  function openJobAndRunForecast() {
    // Opens a job in a 'closed' state prior to running a forecast.
    mlJobService.openJob(job.job_id)
    .then(() => {
      // If open was successful run the forecast, then close the job again.
      runForecast(true);
    })
    .catch((resp) => {
      console.log('Time series forecast modal - could not open job:', resp);
      msgs.error('Error opening job before running forecast.', resp);
      $scope.isForecastRunning = false;
    });
  }

  function runForecast(closeJobAfterRunning) {
    $scope.isForecastRunning = true;

    const forecastDuration = parseInterval($scope.newForecastDuration);
    const jobLatest = job.data_counts.latest_record_timestamp;
    const forecastEnd = moment(jobLatest).add(forecastDuration.asMilliseconds(), 'ms');

    mlForecastService.runForecast(job.job_id, forecastEnd.valueOf())
    .then((resp) => {
      // Endpoint will return { acknowledged:true, id: <now timestamp> } before forecast is complete.
      // So wait for results and then refresh the dashboard to the end of the forecast.
      if (resp.id !== undefined) {
        waitForForecastResults(resp.id, forecastEnd, closeJobAfterRunning);
      } else {
        console.log('Unexpected response from running forecast', resp);
        msgs.error('Unexpected response from running forecast.', resp);
      }
    })
    .catch((resp) => {
      console.log('Time series forecast modal - error running forecast:', resp);
      msgs.error('Error running forecast.', resp);
    });

  }

  function waitForForecastResults(forecastId, forecastEnd, closeJobAfterRunning) {
    // Attempt to load 6 hours of forecast data up to the specified end time.
    // As soon as we have results, trigger the time series explorer to refresh
    // to show the forecast data.
    forecastChecker = $interval(() => {
      mlForecastService.getForecastData(
        job,
        detectorIndex,
        forecastId,
        entities,
        forecastEnd.subtract(6, 'h').valueOf(),
        forecastEnd.add(6, 'h').valueOf(),
        '1h')
      .then((resp) => {
        if (_.keys(resp.results).length > 0) {
          $interval.cancel(forecastChecker);
          $scope.isForecastRunning = false;

          if (closeJobAfterRunning === true) {
            mlJobService.closeJob(job.job_id)
            .then(() => {
              $scope.isForecastRunning = false;
              loadForForecastId(forecastId);
              $scope.close();
            })
            .catch((closeResp) => {
              // Load the forecast data in the main page,
              // but leave this dialog open so the error can be viewed.
              msgs.error('Error closing job after running forecast.', closeResp);
              loadForForecastId(forecastId);
              $scope.isForecastRunning = false;
            });
          } else {
            loadForForecastId(forecastId);
            $scope.close();
          }
        }
      }).catch((resp) => {
        console.log('Time series forecast modal - error getting model forecast data from elasticsearch:', resp);
        msgs.error('Error checking whether forecast has finished.', resp);
        $scope.isForecastRunning = false;
        $interval.cancel(forecastChecker);
      });
    }, 250);
  }

});
