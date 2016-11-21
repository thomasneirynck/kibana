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

// the version of angular bootstrap ui included in kibana is old
// and doesn't allow html or templates to be used as the content of popovers
// we have to manually add this functionality as a custom directive
import 'ui-bootstrap'
angular.module('ui.bootstrap.popover')
  .directive('popoverHtmlUnsafePopup', function($compile) {
    return {
      restrict: 'EA',
      replace: true,
      scope: {
        title: '@',
        content: '@',
        placement: '@',
        animation: '&',
        isOpen: '&'
      },
      template: '<div class="popover {{placement}}" ng-class="{ in: isOpen(), fade: animation() }"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title" bind-html-unsafe="title" ng-show="title"></h3><div class="popover-content" bind-html-unsafe="content" ></div></div></div>',
      link: function(scope, element, attrs) {
        // The content of the popup is added as a string and does not run through angular's templating system.
        // therefore {{stuff}} substitutions don't happen.
        // we have to manually apply the template, compile it with this scope and then set it as the html
        scope.$apply();
        var cont = $compile(scope.content)(scope);
        element.find(".popover-content").html(cont);

        // function to force the popover to close
        scope.closePopover = function () {
          scope.$parent.$parent.isOpen = false;
          scope.$parent.$parent.$applyAsync();
          element.remove();
        };
      }
    };
  })
  .directive('popoverHtmlUnsafe', ['$tooltip', function($tooltip) {
    return $tooltip('popoverHtmlUnsafe', 'popover', 'click');
  }]);
