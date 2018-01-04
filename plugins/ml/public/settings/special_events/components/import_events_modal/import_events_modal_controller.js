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

const icalendar = require('icalendar');
import $ from 'jquery';

import 'plugins/ml/settings/special_events/components/events_list';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlImportEventsModal', function (
  $scope,
  $q,
  $timeout,
  $modalInstance) {

  $scope.loadingLock = false;
  $scope.newEvents = [];
  $scope.fileLoaded = false;
  $scope.file = undefined;

  $timeout(() => {
    $('.modal-dialog').width(750);
  }, 0);

  const MAX_FILE_SIZE_MB = 100;
  // called when a file is selected using the file browser
  $scope.fileNameChanged = function (el) {
    $scope.$apply(() => {
      if (el.files.length) {
        reset();
        $scope.file = el.files[0];
        if ($scope.file.size <= (MAX_FILE_SIZE_MB * 1000000)) {
          readFile($scope.file)
            .then((resp) => {
              try {
                $scope.newEvents = parseICSFile(resp.data);
                $scope.fileLoaded = true;
                $scope.loadingLock = false;
              } catch (error) {
                $scope.error = true;
                $scope.errorMessage = 'Could not parse ICS file';
              }
            })
            .catch((error) => {
              console.error(error);
              $scope.loadingLock = false;
            });
        } else {
          $scope.fileLoaded = false;
          $scope.loadingLock = false;
        }
      }
    });
  };

  function readFile(file) {
    return $q((resolve, reject) => {
      $scope.loadingLock = true;

      if (file && file.size) {
        const reader = new FileReader();
        reader.readAsText(file);

        reader.onload = (() => {
          return () => {
            $scope.loadingLock = false;
            const data = reader.result;
            if (data === '') {
              reject();
            } else {
              resolve({ data });
            }
          };
        })(file);
      } else {
        reject();
      }
    });
  }

  function reset() {
    $scope.file = undefined;
    $scope.fileLoaded = false;
    $scope.loadingLock = false;
    $scope.newEvents = [];
    $scope.error = false;
    $scope.errorMessage = '';
  }

  function parseICSFile(data) {
    const cal = icalendar.parse_calendar(data);
    return createEvents(cal);
  }

  function createEvents(ical) {
    const events = ical.events();
    const mlEvents = [];
    events.forEach((e) => {
      if (e.element === 'VEVENT') {
        const description = e.properties.SUMMARY;
        const start = e.properties.DTSTART;
        const end = e.properties.DTEND;

        if (description && start && end && description.length && start.length && end.length) {
          mlEvents.push({
            description: description[0].value,
            start_time: start[0].value.valueOf(),
            end_time: end[0].value.valueOf(),
          });
        }
      }
    });
    return mlEvents;
  }

  $scope.save = function () {
    $modalInstance.close($scope.newEvents);
    reset();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});
