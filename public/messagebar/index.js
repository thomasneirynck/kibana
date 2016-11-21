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

import _ from 'lodash';
import "./styles/main.less";

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlMessageBarService', ['$http', '$q', function ($http, $q) {
  var MSG_STYLE = {INFO: "prl-message-info", WARNING: "prl-message-warning", ERROR: "prl-message-error"};

  this.messages = [];

  this.addMessage = function(msg) {
    if(!_.findWhere(this.messages, msg ) ) {
      this.messages.push(msg);
    }
  };

  this.removeMessage = function(index) {
    this.messages.splice(index, 1);
  };

  this.clear = function() {
    this.messages.length = 0;
  };

  this.info = function(text) {
    this.addMessage({text: text, style: MSG_STYLE.INFO});
  };

  this.warning = function(text) {
    this.addMessage({text: text, style: MSG_STYLE.WARNING});
  };

  this.error = function(text) {
    this.addMessage({text: text, style: MSG_STYLE.ERROR});
  };

}])

.controller('PrlMessageBarController', ['$scope', 'prlMessageBarService', function($scope, prlMessageBarService) {
  $scope.messages = prlMessageBarService.messages;
  $scope.removeMessage = prlMessageBarService.removeMessage;
}])

.directive('prlMessageBar', ['prlMessageBarService', function(prlMessageBarService) {
  return {
    restrict: 'AE',
    template: require('plugins/prelert/messagebar/messagebar.html')
  };

}]);

