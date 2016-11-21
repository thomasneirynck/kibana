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
 * Angular directive for rendering a list of the top influencer field values for a 
 * particular influencer field name, as used in the tooltip for the 'by influencer'
 * swimlane of the Summary dashboard.
 */
    
    
import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
    
import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlSwimlaneInfluencers', function ($timeout, prlResultsService) {
    
  function link(scope, $element, $attrs) {
    scope.indexPattern = scope.$parent.indexPattern;
    scope.influencerFieldName = scope.$parent.influencerFieldName;
    scope.selectedJobIds = scope.$parent.selectedJobIds;
    scope.earliestMs = scope.$parent.earliestMs;
    scope.latestMs = scope.$parent.latestMs;
    scope.itemPageY = scope.$parent.itemPageY;
    scope.loadedInfluencers = false;
    
    // Set up an Angular timeout to query Elasticsearch for the top influencers
    // after the delay has passed. This will be cancelled if the scope is destroyed
    // before the delay has passed, for example when the mouse quickly sweeps over a
    // number of points in the swimlane.
    var timer = $timeout(function() {}, 750);
    timer.then(
      function() {
        getTopInfluencersData();
      },
      function() {
        // Timer cancelled - don't request influencers data.
      }
    );
    
    // Call results service to get top 5 influencer field values.
    function getTopInfluencersData() { 
      prlResultsService.getTopInfluencerValues(
          scope.indexPattern.id, scope.selectedJobIds, scope.influencerFieldName, scope.earliestMs, scope.latestMs, 5)
      .then(function(resp) {
        scope.loadedInfluencers = true;
        
        if (resp.results.length > 0) {
          // Re-position the tooltip so increased vertical height is visible on screen.
          var $win = $(window);
          var winHeight = $win.height();
          var yOffset = window.pageYOffset;
          var height = $(".prl-swimlane-tooltip").outerHeight(true) + (resp.results.length*37);
          var itemY = scope.itemPageY;
          $(".prl-swimlane-tooltip").css('top', itemY + height < winHeight + yOffset ? itemY : itemY - height); 
        }
        
        scope.influencers = _.map(resp.results, function(result){
          var score = parseInt(result.maxAnomalyScore);
          var bandScore = score != 0 ? score: 1;
          var displayScore = score != 0 ? score: '< 1';
          var severity = anomalyUtils.getSeverity(score);
          var influencer = {'influencerFieldValue': result.influencerFieldValue,
              'bandScore': score > 3 ? score: 3,  // Gives the band some visible width for low scores.
              'score': score,
              'severity': severity
              };
          return influencer;
        });
        
      }).catch(function(resp) {
        scope.loadedInfluencers = true;
        console.log("prlSwimlaneInfluencers directive - error getting top influencer field values info from ES:", resp);
      });
    }
    
    // If the scope is destroyed, cancel the timer so that we don't request 
    // the top influencer data for a tooltip that is no longer showing.
    scope.$on('$destroy', function(event) {
        $timeout.cancel(timer);
      }
    );
  }
  
  return {
    restrict: 'AE',
    replace: false,
    scope: {},
    template: require('plugins/prelert/swimlane/swimlane_influencers/swimlane_influencers.html'),
    link: link
  };
});
