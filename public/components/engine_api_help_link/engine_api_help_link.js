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

// the tooltip descriptions are located in tooltips.json

import './styles/main.less';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlEngineApiHelpLink', function() {
  return {
    scope: {
      uri: "@prlUri",
      label: "@prlLabel"
    },
    restrict: 'AE',
    replace: true,
    template: '<a href="{{fullUrl()}}" target="_blank" class="prl-engine-api-help-link" tooltip="{{label}}">{{label}}<i class="fa fa-external-link"></i></a>',
    controller: function($scope) {
      var website = "http://www.prelert.com/docs/engine_api";
      var version = "2.0";
      $scope.fullUrl = function() {return website + "/" + version + "/" + $scope.uri;};
    }
  };

});
