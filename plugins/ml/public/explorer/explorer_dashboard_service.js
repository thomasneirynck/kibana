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
 * Service for firing and registering for events across the different
 * components in the Explorer dashboard.
 */

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlExplorerDashboardService', function () {

  const listeners = {
    'swimlaneCellClick': [],
    'swimlaneDataChanged': []
  };

  this.init = function () {
    // Clear out any old listeners.
    listeners.swimlaneCellClick.splice(0);
    listeners.swimlaneDataChanged.splice(0);
  };

  this.fireSwimlaneCellClick = function (cellData) {
    listeners.swimlaneCellClick.forEach(function (listener) {
      listener(cellData);
    });
  };

  this.onSwimlaneCellClick = function (listener) {
    listeners.swimlaneCellClick.push(listener);
  };

  this.fireSwimlaneDataChanged = function (swimlaneType) {
    listeners.swimlaneDataChanged.forEach(function (listener) {
      listener(swimlaneType);
    });
  };

  this.onSwimlaneDataChanged = function (listener) {
    listeners.swimlaneDataChanged.push(listener);
  };

});
