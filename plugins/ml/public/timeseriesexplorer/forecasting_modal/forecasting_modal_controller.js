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
  mlMessageBarService) {

  $scope.newForecastDuration = '1d';
  $scope.newForecastDurationValid = true;
  $scope.isForecastRunning = false;

  const job = params.job;
  const detectorIndex = params.detectorIndex;
  const entities = params.entities;
  const loadForForecastId = params.pscope.loadForForecastId;
  let forecastChecker = null;

  const msgs = mlMessageBarService;
  msgs.clear();

  $scope.newForecastDurationChange = function () {

    $scope.newForecastDurationValid = true;
    if(parseInterval($scope.newForecastDuration) === null) {
      $scope.newForecastDurationValid = false;
    }
  };

  $scope.runForecast = function () {
    msgs.clear();

    $scope.isForecastRunning = !$scope.isForecastRunning;

    const forecastDuration = parseInterval($scope.newForecastDuration);
    const jobLatest = job.data_counts.latest_record_timestamp;
    const forecastEnd = moment(jobLatest).add(forecastDuration.asMilliseconds(), 'ms');

    mlForecastService.runForecast(job.job_id, forecastEnd.valueOf())
    .then((resp) => {
      // Endpoint will return { acknowledged:true, id: <now timestamp> } before forecast is complete.
      // So wait for results and then refresh the dashboard to the end of the forecast.
      if (resp.id !== undefined) {
        waitForForecastResults(resp.id, forecastEnd);
      } else {
        console.log('Unexpected response from running forecast', resp);
        msgs.error('Unexpected response from running forecast', resp);
      }
    })
    .catch((resp) => {
      console.log('Time series forecast modal - error running forecast:', resp);
      msgs.error('Error running forecast', resp);
    });

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

  function waitForForecastResults(forecastId, forecastEnd) {
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
          loadForForecastId(forecastId);
          $scope.close();
        }
      }).catch((resp) => {
        console.log('Time series forecast modal - error getting model forecast data from elasticsearch:', resp);
        msgs.error('Error checking whether forecast has finished', resp);
        $interval.cancel(forecastChecker);
      });
    }, 250);

  }

});
