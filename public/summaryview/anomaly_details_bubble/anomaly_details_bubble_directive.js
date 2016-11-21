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

import moment from 'moment';
import _ from 'lodash';
import d3 from 'd3';
import stringUtils from 'plugins/prelert/util/string_utils';
import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import 'plugins/prelert/filters/abbreviate_whole_number';

let module = uiModules.get('apps/prelert');
import uiModules from 'ui/modules';

module.directive('prlAnomalyDetailsBubble', ['$location', 'prlJobService', 'prlAnomalyRecordDetailsService', 'prlSwimlaneService', function($location, prlJobService, prlAnomalyRecordDetailsService, prlSwimlaneService) {
  return {
    restrict: 'AE',
    replace: false,
    // scope: {},
    template: require('plugins/prelert/summaryview/anomaly_details_bubble/anomaly_details_bubble.html'),
    link: function($scope, $element, $attrs) {
      $scope.title = "Highest anomaly per detector";
      $scope.service = prlAnomalyRecordDetailsService;

      $scope.openExplorer = function() {
        prlSwimlaneService.openExplorer();
      };

      $scope.openConnections = function() {
        prlSwimlaneService.openConnections();
      };

      $scope.expandInfluencers = function() {
        $scope.service.expandInfluencers();
      }
    }
  };
}])
.service("prlAnomalyRecordDetailsService", function($q, $timeout, es, timefilter, prlJobService, prlSwimlaneSearchService) {
  var TimeBuckets = require('ui/time_buckets');

  var PRELERT_RESULTS_INDEX_ID = 'prelertresults-*';
  // number of records loaded once when the page opens
  var RECORD_COUNT = 1000;

  var selectedJobIds = {};
  var bucketInterval = null;
  var bounds = timefilter.getActiveBounds();
  var times = [];
  var timesFormated = {};
  var allRecordResults;

  var highestRecords = {
    JOB:        {},
    MONITOR:    {},
    DETECTOR:   {},
    INF_VALUE:  {},
    INSPECTOR:  {}
  };

  var that = this;
  this.type = {
    MONITOR:   0,
    JOB:       1,
    DETECTOR:  2,
    INF_TYPE:  3,
    INF_VALUE: 4,
    INSPECTOR: 5,
    EVENTRATE: 6
  };

  this.visible = false;
  this.recordsPerDetector = null;
  this.targetTop = 0;
  this.$target;
  this.arrowTop = 0;
  this.bubbleHeight = 0;
  this.recordListHeight = 0;
  this.bubbleTop = 0;
  this.laneLabel = "";
  this.$bubble;
  this.$bubbleHeading;
  this.$arrow;
  this.cardColor = "#FFFFFF";
  this.bucketTime = 0;
  this.bucketTimeFormated = "";
  this.showTopInfluencers = true;
  this.influencersExpanded = true;
  this.$lockedCell = null;
  this.topInfluencerTab = 0;
  this.recordLimit = 3;
  this.initialised = false;
  this.changeTab = function(i) {
    this.topInfluencerTab = i;
    if(i===1) {
      drawBubbleChart();
    }
  };
  this.topInfluencerList = [];
  this.topInfluencerForPage = [];

  this.topInfluencers = {
    MONITOR:   {},
    JOB:       {},
    DETECTOR:  {},
    INF_TYPE:  {},
    INF_VALUE: {}
  };

  this.inspectorTopInfluencers = {
    MONITOR:   {},
    JOB:       {},
    DETECTOR:  {},
    INF_TYPE:  {},
    INF_VALUE: {}
  };

  this.setSelectedJobIds = function(jobs) {
    selectedJobIds = jobs;
  };
  this.setBucketInterval = function(b) {
    bucketInterval = b;
  };
  this.getBucketInterval = function() {
    return bucketInterval;
  };
  this.setTimes = function(timesIn) {
    _.each(timesIn, function(t){
      var time = +t;
      if(times[time] === undefined) {
        times.push(+t);
        timesFormated[time] = moment((time)*1000).format('MMMM Do YYYY, HH:mm:ss');
      }
    });
  };

  this.clearTimes = function() {
    times = [];
  };
  this.getTimes = function() {
    return times;
  };
  this.setBounds = function(b) {
    bounds = b;
  };

  this.load = function (){
    refresh();
  };

  this.hide = function() {
    this.visible = false;
  };

  function clearHighestRecords() {
    highestRecords.MONITOR = {};
    highestRecords.JOB = {};
    highestRecords.DETECTOR = {};
    highestRecords.INF_TYPE = {};
    highestRecords.INF_VALUE = {};
  }

  this.clearTopInfluencers = function () {
    this.topInfluencers.MONITOR = {};
    this.topInfluencers.JOB = {};
    this.topInfluencers.DETECTOR = {};
    this.topInfluencers.INF_TYPE = {};
    this.topInfluencers.INF_VALUE = {};
  };

  this.clearInspectorTopInfluencers = function () {
    this.inspectorTopInfluencers.MONITOR = {};
    this.inspectorTopInfluencers.JOB = {};
    this.inspectorTopInfluencers.DETECTOR = {};
    this.inspectorTopInfluencers.INF_TYPE = {};
    this.inspectorTopInfluencers.INF_VALUE = {};
  };

  this.toggleLock = function($target) {
    if(this.$lockedCell === null && $target !== undefined) {
      $target.html($("<i>", {
        "class": "fa fa-thumb-tack pin",
      }));
      this.$lockedCell = $target;
    } else {
      if(this.$lockedCell) {
        this.$lockedCell.empty();
      }

      this.$lockedCell = null;
    }
  };
  this.isLocked = function() {
    return this.$lockedCell !== null;
  };

  function refresh() {
    clearHighestRecords();
    that.clearTopInfluencers();

    // load records for the page
    prlSwimlaneSearchService.getRecords(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
        bounds.min.valueOf(), bounds.max.valueOf(), RECORD_COUNT)
    .then(function(resp){
      console.log("anomaly bubble refresh data:", resp);

      allRecordResults = resp.records;
      var bucketedResults = bucketResults(allRecordResults, times);
      processRecordResults(bucketedResults, highestRecords);

      // init position
      that.visible = true;

      if(that.$bubble === undefined) {
        that.$bubble = $(".anomaly-details-bubble");
        that.$bubbleHeading = that.$bubble.find(".heading");
        that.$arrow = that.$bubble.find(".arrow");
        that.$recordList = that.$bubble.find(".record-list");
      }
      that.position(true);

    }).catch(function(resp) {
      console.log("SummaryView visualization - error getting scores by influencer data from elasticsearch:", resp);
    });
  }

  // load top influencers for the page
  this.loadTopInfluencersForPage = function() {
    loadTopInfluencersForPage(selectedJobIds, (bounds.min.valueOf()/1000), (bounds.max.valueOf()/1000) );
  };

  function bucketResults(data, times) {
    var recordsPerTimeInterval = {};

    for(var r in data) {
      var record = data[r];
      if(record.time === undefined) {
        record.time = moment(record["@timestamp"]).unix();
      }
    }

    data = _.sortBy(data, "time");

    var counter = 0;
    for(var r in data) {
      var record = data[r];
      if(record.detectorText === undefined) {
        record.detector = prlJobService.detectorsByJob[record.jobId][record.detectorIndex];
        record.detectorText = record.detector.detectorDescription;
        // console.log(record.detector)
      }

      var lastT = null;
      for(var i=0;i<times.length;i++) {
        var t = +times[i];
        var found = false;

        if(lastT === null) {
          lastT = t;
        }
        if(recordsPerTimeInterval[t] === undefined) {
          recordsPerTimeInterval[t] = [];
        }

        if(record.time < t) {
          recordsPerTimeInterval[lastT].push(record);
          found = true;
        } else if(counter === data.length-1 && record.time === t) {
          // the last result will be missed, so check for that.
          recordsPerTimeInterval[t].push(record);
          found = true;
        }

        lastT = t;

        if(found) {
          break;
        }
      }
      counter++;
    }
    return recordsPerTimeInterval;
  }

  function processRecordResults(recordsPerTimeInterval, highestRecordsIn) {

    // console.log("all the records!!!!", recordsPerTimeInterval)
    var tempHighestRecordPerBucket = {};
    var tempHighestRecordPerInfluencer = {};
    var tempHighestRecordPerInfluencerType = {};
    var tempMonitorHighestRecordPerBucket = {};
    var tempDetectorHighestRecordPerBucket = {};

    _.each(recordsPerTimeInterval, function(bucket, t) {
      bucket = _.sortBy(bucket, "normalizedProbability").reverse();

      tempHighestRecordPerBucket[t] = {};
      tempMonitorHighestRecordPerBucket[t] = {"All jobs": []};

      var highestJobCounts = {};
      var highestMonitorCounts = {};
      var highestDetectorCounts = {};
      var highestInfluencerCounts = {};
      var highestInfluencerTypeCounts = {};

      _.each(bucket, function(record){
        buildDescription(record);
        var jobId = record.jobId;
        if(highestJobCounts[jobId] === undefined) {
          highestJobCounts[jobId] = {};
        }

        if(highestJobCounts[jobId][record.detectorText] === undefined ) {
          highestJobCounts[jobId][record.detectorText] = [];
        }
        if(highestMonitorCounts[record.detectorText] === undefined ) {
          highestMonitorCounts[record.detectorText] = [];
        }
        if(highestDetectorCounts[record.detectorText] === undefined ) {
          highestDetectorCounts[record.detectorText] = {};
          highestDetectorCounts[record.detectorText][record.detectorText] = [];
        }

        highestJobCounts[jobId][record.detectorText].push(record);
        highestMonitorCounts[record.detectorText].push(record);
        highestDetectorCounts[record.detectorText][record.detectorText].push(record);

        tempHighestRecordPerBucket[t][jobId] = highestJobCounts[jobId];

        _.each(record.influencers, function(inf) {
          if(highestInfluencerTypeCounts[inf.influencerFieldName] === undefined ) {
            highestInfluencerTypeCounts[inf.influencerFieldName] = {};
          }
          if(highestInfluencerTypeCounts[inf.influencerFieldName][record.detectorText] === undefined ) {
            highestInfluencerTypeCounts[inf.influencerFieldName][record.detectorText] = [];
          }
          highestInfluencerTypeCounts[inf.influencerFieldName][record.detectorText].push(record);

          _.each(inf.influencerFieldValues, function(infVal) {
            if(highestInfluencerCounts[infVal] === undefined ) {
              highestInfluencerCounts[infVal] = {};
            }
            if(highestInfluencerCounts[infVal][record.detectorText] === undefined ) {
              highestInfluencerCounts[infVal][record.detectorText] = [];
            }
            if(_.indexOf(highestInfluencerCounts[infVal][record.detectorText], record) === -1) {
              highestInfluencerCounts[infVal][record.detectorText].push(record);
            }
          });
        });
      });

      tempHighestRecordPerInfluencer[t] = highestInfluencerCounts;
      tempHighestRecordPerInfluencerType[t] = highestInfluencerTypeCounts;
      tempMonitorHighestRecordPerBucket[t]["All jobs"] = highestMonitorCounts;
      tempDetectorHighestRecordPerBucket[t] = highestDetectorCounts;
    });


    highestRecordsIn.JOB =  tempHighestRecordPerBucket;
    highestRecordsIn.MONITOR =  tempMonitorHighestRecordPerBucket;
    highestRecordsIn.DETECTOR =  tempDetectorHighestRecordPerBucket;
    highestRecordsIn.INF_VALUE =  tempHighestRecordPerInfluencer;
    highestRecordsIn.INF_TYPE =  tempHighestRecordPerInfluencerType;

    // console.log(highestRecordsIn);
  }

  this.createInspectorRecords = function(swimlaneSubType, recordJobIds, swimlaneTimeRange, times) {
    var newResults = [];
    _.each(allRecordResults, function(res) {
      if(res.time >= swimlaneTimeRange.start && res.time < (swimlaneTimeRange.end+swimlaneTimeRange.interval)) {
        // if JOB type, only use the one supplied job id. otherwise, search through all job ids
        if(that.type[swimlaneSubType] !== that.type.JOB || (that.type[swimlaneSubType] === that.type.JOB && res.jobId === recordJobIds[0])) {
          newResults.push(res);
        }
      }
    });

    var bucketedResults = bucketResults(newResults, times);
    var tempHighestRecords = {};
    processRecordResults(bucketedResults, tempHighestRecords);
    // the INSPECTOR type can contain data for any other type
    highestRecords.INSPECTOR = tempHighestRecords[swimlaneSubType];
  };

  function buildDescription(record) {
    var description = anomalyUtils.getSeverity(record.normalizedProbability) + " anomaly in " ;//+ record.detectorText;
    var descriptionExtra = "";

    if (_.has(record, 'partitionFieldName') && (record.partitionFieldName != record.entityName) ) {
        descriptionExtra += " detected in " + record.partitionFieldName;
        descriptionExtra += " ";
        descriptionExtra += record.partitionFieldValue;
    }
    if (_.has(record, 'byFieldValue')) {
        descriptionExtra += " for " + record.byFieldName;
        descriptionExtra += " ";
        descriptionExtra += record.byFieldValue;
    } else if (_.has(record, 'overFieldValue')) {
        descriptionExtra += " for " + record.overFieldName;
        descriptionExtra += " ";
        descriptionExtra += record.overFieldValue;
    }

    if (_.has(record, 'entityName')) {
        descriptionExtra += " found for " + record.entityName;
        descriptionExtra += " ";
        descriptionExtra += record.entityValue;
    }



    record.description = description;
    record.descriptionExtra = descriptionExtra;
    record.score = (record.normalizedProbability < 1)?"<1":Math.floor(record.normalizedProbability);
    // record.severityLabel = anomalyUtils.getSeverity(record.normalizedProbability);
    record.cardColor = anomalyUtils.getSeverityColor(record.normalizedProbability);
    // $scope.description = description;

    // Check for a correlatedByFieldValue in the source which will be present for multivariate analyses
    // where the record is anomalous due to relationship with another 'by' field value.
    if (_.has(record, 'correlatedByFieldValue')) {
        var mvDescription = "multivariate correlations found in ";
        mvDescription += record.byFieldName;
        mvDescription += "; ";
        mvDescription += record.byFieldValue;
        mvDescription += " is considered anomalous given ";
        mvDescription += record.correlatedByFieldValue;
        record.multiVariateDescription = mvDescription;
    }

  }

  this.position = function(scrolling) {
    var doc = document.documentElement;
    var scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    this.arrowTop = this.targetTop + 43 - scrollTop;


    if(this.$target !== undefined) {
      if(this.$target.parent().hasClass("cells-container-inspector")) {
        this.arrowTop += $("#swimlane-inspector").position().top;
      }
    } else {
      // nothing has been hovered over, default to the monitor swimlane
      this.arrowTop = 259;
    }

    if(this.arrowTop < 5) {
      this.arrowTop = -10000;
    }

    if(scrollTop > 73) {
      this.bubbleTop = scrollTop - 73;
      this.bubbleHeight = doc.offsetHeight - 10;

    } else {
      this.bubbleTop = 0;
      this.bubbleHeight = doc.offsetHeight - 83  + scrollTop;
    }

    if(scrolling && this.$bubble !== undefined) {
      this.$bubble.css({
        "top": this.bubbleTop,
        "height": this.bubbleHeight
      });
      this.$arrow.css({
        "top": this.arrowTop,
      });
      var height = 473;
      if(!this.influencersExpanded) {
        height = 73;
      }
      if(!this.showTopInfluencers) {
        height = 45;
      }
      this.$recordList.css({
        "height": this.bubbleHeight - this.$bubbleHeading.height() - height,
      });
    }
  };

  window.onscroll = function() {
    that.position(true);
  };
  // window.onscroll = _.debounce(function() {
  //   that.position(true);
  // }, 100);

  this.hover = function(time, laneLabel, bucketScore, top, target, swimlaneType, inspector) {
    this.initialised = true;

    if(this.$lockedCell === null) {
      var type = this.type[swimlaneType];
      this.recordLimit = 3;

      this.$target = $(target);

      if(bucketScore !== undefined) {
        this.targetTop = top;
        if(type === this.type.JOB) {
          this.laneLabel = prlJobService.jobDescriptions[laneLabel];
        } else {
          this.laneLabel = laneLabel;
        }
        this.bucketScore = (+bucketScore < 1)?"<1":Math.floor(bucketScore);
        this.cardColor = (target && target.lastChild) ? target.lastChild.style.backgroundColor: "#FFFFFF";
        this.bucketTime = time;
        this.bucketTimeFormated = timesFormated[time];

        if(highestRecords[swimlaneType] && highestRecords[swimlaneType][time]) {
          this.recordsPerDetector = highestRecords[swimlaneType][time][laneLabel];
          this.visible = true;
        } else {
          this.recordsPerDetector = {};
        }
      } else {
         // this.records = {};
      }

      // display top influencers
      if(type === this.type.MONITOR || type === this.type.INF_TYPE) {

        loadTopInfluencers(that.topInfluencers, laneLabel, selectedJobIds, swimlaneType, time, (time+bucketInterval.asSeconds()) );
        this.showTopInfluencers = true;
        this.visible = true;

      } else if(type === this.type.JOB) {

        loadTopInfluencers(that.topInfluencers, laneLabel, [laneLabel], swimlaneType, time, (time+bucketInterval.asSeconds()) );
        this.showTopInfluencers = true;
        this.visible = true;

      } else if(type === this.type.INSPECTOR) {
        // inspector
        // console.log(laneLabel, [laneLabel], swimlaneType, time, (time+bucketInterval.asSeconds()) , inspector);

        var parentType = this.type[inspector.swimlaneType];

        if(parentType === this.type.MONITOR || parentType === this.type.INF_TYPE) {
          loadTopInfluencers(that.inspectorTopInfluencers, laneLabel, inspector.selectedJobIds, inspector.swimlaneType, time, time + inspector.timeRange.interval );
          this.showTopInfluencers = true;
          this.visible = true;

        } else if(parentType === this.type.JOB) {
          loadTopInfluencers(that.inspectorTopInfluencers, laneLabel, [laneLabel], inspector.swimlaneType, time, time + inspector.timeRange.interval );
          this.showTopInfluencers = true;
          this.visible = true;
        } else if(parentType === this.type.INF_VALUE || parentType === this.type.DETECTOR){
          this.showTopInfluencers = false;
          this.recordLimit = 50;
        } else {
          this.showTopInfluencers = false;
        }

      } else if(type === this.type.INF_VALUE || type === this.type.DETECTOR){
        this.showTopInfluencers = false;
        this.recordLimit = 50;
      } else {
        this.showTopInfluencers = false;
      }

      if(this.$recordList) {
        this.$recordList.scrollTop(0);
      }
      this.position(true);
    }
  };

  function loadTopInfluencers(topInfluencers, laneLabel, jobIds, swimlaneType, earliestMs, latestMs) {
    if(topInfluencers[swimlaneType][laneLabel] === undefined || topInfluencers[swimlaneType][laneLabel][earliestMs] === undefined) {

      // placeholder to stop loading if the previous results aren't back yet
      if(topInfluencers[swimlaneType][laneLabel] === undefined ) {
        topInfluencers[swimlaneType][laneLabel] = {};
      }
      topInfluencers[swimlaneType][laneLabel][earliestMs] = null;

      prlSwimlaneSearchService.getTopInfluencers(PRELERT_RESULTS_INDEX_ID, laneLabel, jobIds, swimlaneType,
          earliestMs, latestMs, 0, that.type)
      .then(function(resp){
        // console.log("top influencer data:", resp);

        processTopInfluencersResults(topInfluencers, resp.results, earliestMs, laneLabel, swimlaneType);

        // console.log(topInfluencers);
        drawTopInfluencers(topInfluencers[swimlaneType][laneLabel][earliestMs]);

      }).catch(function(resp) {
        console.log("SummaryView visualization - error getting scores by influencer data from elasticsearch:", resp);
      });
    } else if(topInfluencers[swimlaneType][laneLabel][earliestMs] === null) {
      // console.log("loadTopInfluencers(): still loading top influencers")
    } else {
      drawTopInfluencers(topInfluencers[swimlaneType][laneLabel][earliestMs]);

    }
  }



  function processTopInfluencersResults(topInfluencers, results, time, laneLabel, swimlaneType) {
    // console.log("processTopInfluencersResults():", results);
    var list = _.uniq(_.union(results.topMax, results.topSum), false, function(item, key, id){ return item.id; });
    topInfluencers[swimlaneType][laneLabel][time] = list;
  }

  function drawTopInfluencers(inf) {
    that.topInfluencerList = inf;
    if(that.topInfluencerTab === 0) {
      // drawList();
    } else {
      drawBubbleChart();
    }
  }

  function drawList(inf) {
    that.topInfluencerList = _.clone(inf).splice(0,10);
  }


  function loadTopInfluencersForPage(jobIds, earliestMs, latestMs) {

    var swimlaneType = that.type.JOB;
    prlSwimlaneSearchService.getTopInfluencers(PRELERT_RESULTS_INDEX_ID, "", jobIds, swimlaneType,
        earliestMs, latestMs, 0, that.type)
    .then(function(resp){

      var list = _.uniq(_.union(resp.results.topMax, resp.results.topSum), false, function(item, key, id){ return item.id; });
      that.topInfluencerForPage = list;

    }).catch(function(resp) {
      console.log("loadTopInfluencersForPage - error getting scores by influencer data from elasticsearch:", resp);
    });
  }

  this.expandInfluencers = function() {
    this.influencersExpanded = !this.influencersExpanded;
    this.position(true);
  };

  function drawBubbleChart() {
    var influencers = {"children":[]};

    _.each(that.topInfluencerList, function(point) {
      influencers.children.push({"label":point.id, "value": point.sum, "color": point.max});
    });

    var width = $(".prl-anomaly-details-margin").width() - 20;
    var height = width - 25;
    var radius = Math.min(width, height) / 2;
    var diameter = (radius * 2) ;
    var margin = {
        top:    0,
        right:  0,
        bottom: 0,
        left:   0
      };

    var format = d3.format(",d");

    var $topInfluencersContainer = $("#top-influencers-bubble-chart");
    $topInfluencersContainer.empty();

    if(influencers.children.length) {
      var chartContainerElement = d3.select($topInfluencersContainer.get(0));
      var svg = chartContainerElement.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g");

      var circleG = svg
        .append("g")
        .attr("class", "circles")
        .attr("transform", function(d) {
          return "translate(" + (margin.left ) + "," + (margin.top ) + ")";
        });

      var bubble = d3.layout.pack()
        .sort(null)
        .size([diameter, diameter])
        .padding(radius*0.1);

      var circles = circleG.selectAll(".circle")
        .data(bubble.nodes(influencers)
          .filter(function(d) {
            return !d.children;
          }))
        .enter().append("g")
        .attr("class", "fadable circle")
        .attr("transform", function(d) {
          if(isNaN(d.x)) {
            return "translate(0, 0)";
          } else {
            return "translate(" + d.x + "," + d.y + ")";
          }
        });

      circles.append("circle")
        .attr("r", function(d) {
          return (isNaN(d.r)? 0:d.r);
        })
        .style("fill", colorScore);

      circles.append("text")
        .attr("dy", "0em")
        .style("text-anchor", "middle")
        .text(function(d) {
          return d.label;
        });

      circles.append("text")
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(function(d) {
          return Math.floor(d.color);
        });
    }
  }

  var colors = ['#FFFFFF', '#d2e9f7', '#8bc8fb', '#ffdd00', '#ff7e00', '#ff5300', '#fe1d1d'];
  var colorScale = d3.scale.linear()
        .domain([0, 1, 3, 25, 50, 75, 100])
        .range(colors);


  function colorScore(d) {
    return anomalyUtils.getSeverityColor(d.color);
  }


});
