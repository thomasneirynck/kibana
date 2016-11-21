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

import tooltips from "./tooltips.json";
import './styles/main.less';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');
// service for retrieving text from the tooltip.json file
// to add a tooltip to any element:
// <... tooltip="{{prlJsonTooltipService.text('my_id')}}" ...>
module.service('prlJsonTooltipService', function () {
  this.text = function(id) {
  	if(tooltips[id]) {
  		return tooltips[id].text;
  	} else {
  		return "";
  	}
  };
})

// directive for placing an i icon with a popover tooltip anywhere on a page
// tooltip format: <i prl-info-icon="the_id" />
// the_id will match an entry in tooltips.json
.directive('prlInfoIcon', function() {
  return {
    scope: {
      id: "@prlInfoIcon",
    },
    restrict: 'AE',
    replace: true,
    template: '<i aria-hidden="true" class="fa fa-info-circle" tooltip="{{text}}"></i>',
    controller: function($scope) {
      $scope.text = (tooltips[$scope.id])?tooltips[$scope.id].text:"";
    }
  };

});
