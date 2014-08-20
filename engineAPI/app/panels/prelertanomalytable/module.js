/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2014     *
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
 * on +44 (0)20 7953 7243 or email to legal@prelert.com.    *
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


/** @scratch /panels/prelertanomalytable/0
 *
 * == prelertanomalytable
 * Status: *Stable*
 *
 * The prelertanomalytable panel contains a sortable, pageable view of anomaly records
 * obtained from the Prelert Anomaly Detective Engine API. The table is similar in 
 * structure to the Kibana table panel, with interactions such as adhoc terms aggregations 
 * and sorting by clicking on the table header columns. It also adds the ability to link
 * to another dashboard or URL passing the key parameters of the anomaly of interest.
 */
define([
  'angular',
  'app',
  'lodash',
  'kbn',
  'moment',
  'prelertutil'
],
function (angular, app, _, kbn, moment, prelertutil) {
  'use strict';

  var module = angular.module('prelert.panels.prelertanomalytable', []);
  app.useModule(module);

  module.controller('prelertanomalytable', function($rootScope, $scope, $modal, $q, $compile, $timeout,
     querySrv, dashboard, filterSrv) {
    $scope.panelMeta = {
      modals : [
        {
          description: "Inspect",
          icon: "icon-info-sign",
          partial: "app/partials/inspector.html",
          show: false
        }
      ],
      editorTabs : [
        {
          title:'Paging',
          src: 'app/panels/table/pagination.html'
        },
        {
            title:'Data link',
            src: 'app/panels/prelertanomalytable/datalink.html'
        }
      ],
      status: "Stable",
      description: "A paginated table of anomaly records for a Prelert Anomaly Detective Engine API job. " +
      		"Click on a row to expand it and review all of the fields associated with that anomaly.<p>"
    };

    // Set and populate defaults
    var _d = {
      /** @scratch /panels/prelertanomalytable/1
       * === Parameters
       *
       * size:: The number of hits to show per page
       */
      size    : 100, // Per page
      /** @scratch /panels/prelertanomalytable/1
       * pages:: The number of pages available
       */
      pages   : 5,   // Pages available
      /** @scratch /panels/prelertanomalytable/1
       * offset:: The current page
       */
      offset  : 0,
      /** @scratch /panels/prelertanomalytable/1
       * sort:: An array describing the sort order of the table. For example [`@timestamp',`desc']
       */
      sort    : ['_score','desc'],
      /** @scratch /panels/prelertanomalytable/1
       * overflow:: The css overflow property. `min-height' (expand) or `auto' (scroll)
       */
      overflow: 'min-height',
      /** @scratch /panels/prelertanomalytable/1
       * fields:: the fields used a columns of the table, in an array.
       */
      fields  : ['timestamp','anomalyScore','unusualScore','byFieldName','byFieldValue','function','fieldName','typical','actual'],
      /** @scratch /panels/prelertanomalytable/1
       * sortable:: Set sortable to false to disable sorting
       */
      sortable: true,
      /** @scratch /panels/prelertanomalytable/1
       * header:: Set to false to hide the table column names
       */
      header  : true,
      /** @scratch /panels/prelertanomalytable/1
       * paging:: Set to false to hide the paging controls of the table
       */
      paging  : true,
      /** @scratch /panels/prelertanomalytable/1
       * field_list:: Set to false to hide the list of fields. The user will be able to expand it,
       * but it will be hidden by default
       */
      field_list: true,
      /** @scratch /panels/prelertanomalytable/1
       * trimFactor:: The trim factor is the length at which to truncate fields takinging into
       * consideration the number of columns in the table. For example, a trimFactor of 100, with 5
       * columns in the table, would trim each column at 20 character. The entirety of the field is
       * still available in the expanded view of the event.
       */
      trimFactor: 300,
      /** @scratch /panels/prelertanomalytable/1
       * localTime:: Set to true to adjust the timeField to the browser's local time
       */
      localTime: true,
      /** @scratch /panels/prelertanomalytable/1
       * timeField:: If localTime is set to true, this field will be adjusted to the browsers local time
       */
      timeField: 'timestamp',
      /** @scratch /panels/prelertanomalytable/1
       * timeFormat:: If localTime is set to true, the format, using moment.js tokens, in which to display the time.
       */
      timeFormat: 'YYYY-MM-DD HH:mm',
      /** @scratch /panels/prelertanomalytabletable/1
       * linkShow:: Set to false to hide the link to a dashboard for displaying the raw data which has been analyzed for anomalies.
       */
      linkShow  : true,
      /** @scratch /panels/prelertanomalytabletable/1
       * linkIndex:: Controls the index that is set in the target dashboard when drilling down to the raw data from an anomaly.
       */
      linkIndex: {
          interval: 'day',
          pattern: '[logstash-]YYYY.MM.DD',
          default: '_all'
      },
      /** @scratch /panels/prelertanomalytabletable/1
       * linkTarget:: Full or relative URL of page to open when clicking on the 'Show data' link.
       */
      linkTarget  : '#/dashboard/script/prelert_logstash_drilldown.js',
      style   : {'font-size': '9pt'},
      normTimes : true,
    };
    _.defaults($scope.panel,_d);

    $scope.init = function () {
      $scope.columns = {};
      _.each($scope.panel.fields,function(field) {
        $scope.columns[field] = true;
      });

      $scope.Math = Math;
      $scope.identity = angular.identity;
      $scope.$on('refresh',function(){
        $scope.get_data();
      });

      $scope.get_data();
    };

    // Create a percent function for the view
    $scope.percent = kbn.to_percent;

    $scope.closeFacet = function() {
      if($scope.modalField) {
        delete $scope.modalField;
      }
    };

    $scope.termsModal = function(field,chart) {
      $scope.closeFacet();
      $timeout(function() {
        $scope.modalField = field;
        showModal(
          '{"height":"200px","chart":"'+chart+'","field":"'+field+'"}','terms');
      },0);
    };

    $scope.statsModal = function(field) {
      $scope.modalField = field;
      showModal(
        '{"field":"'+field+'"}','statistics');
    };

    var showModal = function(panel,type) {
      $scope.facetPanel = panel;
      $scope.facetType = type;
    };


    $scope.toggle_micropanel = function(field,groups) {
      var docs = _.map($scope.data,function(_d){return _d.kibana._source;});
      var topFieldValues = kbn.top_field_values(docs,field,10,groups);
      $scope.micropanel = {
        field: field,
        grouped: groups,
        values : topFieldValues.counts,
        hasArrays : topFieldValues.hasArrays,
        related : kbn.get_related_fields(docs,field),
        limit: 10,
        count: _.countBy(docs,function(doc){return _.contains(_.keys(doc),field);})['true']
      };
    };

    $scope.micropanelColor = function(index) {
      var _c = ['bar-success','bar-warning','bar-danger','bar-info','bar-primary'];
      return index > _c.length ? '' : _c[index];
    };

    $scope.set_sort = function(field) {
      if($scope.panel.sort[0] === field) {
        $scope.panel.sort[1] = $scope.panel.sort[1] === 'asc' ? 'desc' : 'asc';
      } else {
        $scope.panel.sort[0] = field;
      }
      $scope.get_data();
    };

    $scope.toggle_field = function(field) {
      if (_.indexOf($scope.panel.fields,field) > -1) {
        $scope.panel.fields = _.without($scope.panel.fields,field);
        delete $scope.columns[field];
      } else {
        $scope.panel.fields.push(field);
        $scope.columns[field] = true;
      }
    };

    $scope.toggle_details = function(row) {
      row.kibana.details = row.kibana.details ? false : true;
      row.kibana.view = row.kibana.view || 'table';
      //row.kibana.details = !row.kibana.details ? $scope.without_kibana(row) : false;
    };

    $scope.page = function(page) {
      $scope.panel.offset = page*$scope.panel.size;
      $scope.get_data();
    };

    $scope.fieldExists = function(field,mandate) {
      filterSrv.set({type:'exists',field:field,mandate:mandate});
    };

    $scope.get_data = function() {
        $scope.panel.error =  false;
        $scope.panelMeta.loading = true;
        
        $scope.panel.offset = 0;
        $scope.hits = 0;
        $scope.data = [];
        $scope.current_fields = [];
        
        // If no index (i.e. job ID) is set, then return. 
        var jobId = $scope.dashboard.current.index.default;
        if (_.isUndefined(jobId) || _.isEmpty(jobId)) {
            return;
        }

        // Get the list of jobs from the Prelert Engine API.
        // Paging behaviour is consistent with Kibana where it gets size*pages records 
        // in one query and then does client-side paging through query results.
        // TODO - implement skip for full paging functionality.
        var params = {
            take: $scope.panel.size*$scope.panel.pages
        };
        
        // Check for a time filter. If present, add the last filter in the zoom 'chain'.
        var timeFilters = filterSrv.getByType('time', false);
        var numKeys = _.keys(timeFilters).length;
        if (numKeys > 0) {
            var timeFilter = timeFilters[(numKeys-1)];
            
            var from = kbn.parseDate(timeFilter.from);
            var to = kbn.parseDate(timeFilter.to);
            
            // Default moment.js format() is ISO8601.
            params.start = moment(from).format();
            params.end = moment(to).format();
        } 
        
        $scope.prelertjs.ResultsService.getRecords(jobId, params)
        .success(function(results) {
            console.log("prelertanomalytable records returned by service:");
            console.log(results);
            
            $scope.panelMeta.loading = false;
            
            // For 1.0 beta, filter out the results from population analyses where isOverallResult=false.
            // This will mean that even if the user is requesting 500 pageable records, they will
            // only be able to page through the isOverallResult=true records.
            // TODO - remove after 1.0 beta once endpoint returns these records nested 
            //        inside the isOverallResult=true records.  
            var overallResults = _.filter(results.documents, function(anomaly){ 
                return (_.has(anomaly, 'isOverallResult') == false || anomaly['isOverallResult'] == true); 
            });
            
            // This is exceptionally expensive, especially on events with a large number of fields
            $scope.data = $scope.data.concat(_.map(overallResults, function(anomaly) {
              var _h = _.clone(anomaly);

              // Update the list of fields found in alerts.
              $scope.current_fields = $scope.current_fields.concat(_.keys(_h));
              
              // Add in the 'kibana' object used internally by Kibana to store details used
              // for the table components, such as the micropanel and detail views.
              _h.kibana = {
                _source : kbn.flatten_json(_h)
              };
              
              // Store the severity labels for the bucket and unusual scores.
              _h.severity = prelertutil.get_anomaly_severity(_h.anomalyScore);
              _h.unusualSeverity = prelertutil.get_anomaly_severity(_h.unusualScore);
              
              return _h;
            }));

            $scope.current_fields = _.uniq($scope.current_fields);
            
            $scope.hits = results.hitCount;
            
            // Sort the data - do client-side sorting with Underscore.js
            // since the Jobs endpoint does not have sorting capability.
            var sortField = $scope.panel.sort[0];
            $scope.data = _.sortBy($scope.data, function(v){
                // Use the flattened map.
                return v.kibana._source[sortField];
            });

            // Reverse if needed
            if($scope.panel.sort[1] === 'desc') {
              $scope.data.reverse();
            }
            
            // Keep only what we need for the set
            $scope.data = $scope.data.slice(0,$scope.panel.size * $scope.panel.pages);  
            
        })
        .error(function (error) {
            $scope.panelMeta.loading = false;
            $scope.panel.error = $scope.parse_error("Error obtaining results from the Prelert Engine API." +
                   "Please ensure the Engine API is running and configured correctly.");
            console.log('Error loading list of results from the Prelert Engine API: ' + error.message);
        });
        
    };

    $scope.populate_modal = function(request) {
      $scope.inspector = angular.toJson(JSON.parse(request.toString()),true);
    };

    $scope.without_kibana = function (row) {
      var _c = _.clone(row);
      delete _c.kibana;
      return _c;
    };

    $scope.set_refresh = function (state) {
      $scope.refresh = state;
    };

    $scope.close_edit = function() {
      if($scope.refresh) {
        $scope.get_data();
      }
      $scope.columns = [];
      _.each($scope.panel.fields,function(field) {
        $scope.columns[field] = true;
      });
      $scope.refresh =  false;
    };

    $scope.locate = function(obj, path) {
      path = path.split('.');
      var arrayPattern = /(.+)\[(\d+)\]/;
      for (var i = 0; i < path.length; i++) {
        var match = arrayPattern.exec(path[i]);
        if (match) {
          obj = obj[match[1]][parseInt(match[2],10)];
        } else {
          obj = obj[path[i]];
        }
      }
      return obj;
    };
    
    $scope.show_data = function(event, source) {
        console.log("show_data for:");
        console.log(source);
        
        // Query the index of the clicked on anomaly for the bucketSpan of the job.
        var request = $scope.ejs.Request({
            'indices': source._index,
            'types':'job'
        });
        request = request.query(
                $scope.ejs.MatchAllQuery())
                .fields('_source');
        
        // Open the new window first as window.open() gets blocked as a popup
        // if called from inside an AJAX response.
        // Then set the URL of the new window after we have obtained the bucketSpan.
        var newWindow = window.open("","_blank");
        
        // Stop event propagation to prevent default row details expansion.
        event.stopPropagation();
        
        request.doSearch().then(function(results) {
            var firstHit = _.first(results.hits.hits);
            var bucketSpan = firstHit._source.analysisConfig.bucketSpan;
            
            var params = {};
            
            if ($scope.panel.linkIndex.interval == 'none') {
                params.index = $scope.panel.linkIndex.default;
            }
            else {
                params.pattern = $scope.panel.linkIndex.pattern;
                params.interval = $scope.panel.linkIndex.interval;
            }
            
            // TODO - enhancement for allowing number of buckets either side of anomaly bucket.
            var timestamp = source['timestamp'];
            var from = moment(timestamp);
            var to = moment(timestamp).add('seconds', bucketSpan);
            
            params.from = from.format();
            params.to = to.format();
            
            // Set the Kibana chart mode, and for metric anomalies the fieldName.            
            params.func = source['function'];
            if (_.has(source, 'fieldName') ) {
                params.fieldName = source['fieldName'];
            }
            
            // Add filters for each of the by/partition/over fields.
            var filters = [];
            if (_.has(source, 'byFieldValue') ) {
                var byFilter = {};
                byFilter[source.byFieldName] = source.byFieldValue;
                filters.push(byFilter);
            }
            
            if (_.has(source, 'partitionFieldValue') ) {
                var partitionFilter = {};
                partitionFilter[source.partitionFieldName] = source.partitionFieldValue;
                filters.push(partitionFilter);
            }
            
            if (_.has(source, 'overFieldValue') ) {
                var overFilter = {};
                overFilter[source.overFieldName] = source.overFieldValue;
                filters.push(overFilter);
            }

            params['filters'] = angular.toJson(filters);
        
            var encodedParams = $.param(params);
            console.log("prelertanomalytable show_data() with params " + decodeURIComponent(encodedParams));
            
            var targetUrl = $scope.panel.linkTarget + '?' + encodedParams;        
            newWindow.location.href = targetUrl;
            
        });
 
    };


  });


});
