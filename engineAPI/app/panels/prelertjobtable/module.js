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

/** @scratch /panels/prelertjobtable/0
 *
 * == prelertjobtable
 * Status: *Stable*
 *
 * The prelertjobtable panel contains a sortable, pagable view of Prelert Engine API jobs. 
 * It can be arranged into defined columns and offers several interactions, such as links to the
 * results of a job and to delete a job.
 */
define([
  'angular',
  'app',
  'lodash',
  'kbn',
  'moment',
],
function (angular, app, _, kbn, moment) {
  'use strict';

  var module = angular.module('prelert.panels.prelertjobtable', []);
  app.useModule(module);

  module.controller('prelertjobtable', function($rootScope, $scope, $modal, $q, $compile, $timeout,
    fields, querySrv, dashboard, filterSrv) {
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
        }
      ],
      status: "Stable",
      description: "A paginated table of Prelert Engine API jobs. " +
          "Displays links to view the results of a job and to delete a job. " +
          "Click on a row to view all the properties of a job.<p>"
    };

    // Set and populate defaults
    var _d = {
      /** @scratch /panels/prelertjobtable/1
       * === Parameters
       *
       * size:: The number of hits to show per page
       */
      size    : 100, // Per page
      /** @scratch /panels/prelertjobtable/1
       * pages:: The number of pages available
       */
      pages   : 5,   // Pages available
      /** @scratch /panels/prelertjobtable/1
       * offset:: The current page
       */
      offset  : 0,
      /** @scratch /panels/prelertjobtable/1
       * sort:: An array describing the sort order of the table. For example [`createTime',`desc']
       */
      sort    : ['id','desc'],
      /** @scratch /panels/prelertjobtable/1
       * overflow:: The css overflow property. `min-height' (expand) or `auto' (scroll)
       */
      overflow: 'min-height',
      /** @scratch /panels/prelertjobtable/1
       * fields:: the fields used a columns of the table, in an array.
       */
      fields  : [],
      /** @scratch /panels/prelertjobtable/1
       * sortable:: Set sortable to false to disable sorting
       */
      sortable: true,
      /** @scratch /panels/prelertjobtable/1
       * header:: Set to false to hide the table column names
       */
      header  : true,
      /** @scratch /panels/prelertjobtable/1
       * paging:: Set to false to hide the paging controls of the table
       */
      paging  : true,
      /** @scratch /panels/prelertjobtable/1
       * field_list:: Set to false to hide the list of fields. The user will be able to expand it,
       * but it will be hidden by default
       */
      field_list: true,
      /** @scratch /panels/prelertjobtable/1
       * all_fields:: Set to true to show all fields in the mapping, not just the current fields in
       * the table.
       */
      all_fields: false,
      /** @scratch /panels/prelertjobtable/1
       * trimFactor:: The trim factor is the length at which to truncate fields takinging into
       * consideration the number of columns in the table. For example, a trimFactor of 100, with 5
       * columns in the table, would trim each column at 20 character. The entirety of the field is
       * still available in the expanded view of the event.
       */
      trimFactor: 300,
      /** @scratch /panels/prelertjobtable/1
       * localTime:: Set to true to adjust the timeField to the browser's local time
       */
      localTime: false,
      /** @scratch /panels/prelertjobtable/1
       * timeFields:: If localTime is set to true, these field will be adjusted to the browsers local time
       */
      timeFields: ['createTime', 'lastDataTime', 'finishedTime'],
      /** @scratch /panels/prelertanomalytable/1
       * timeFormat:: If localTime is set to true, the format, using moment.js tokens, in which to display time fields.
       */
      timeFormat: 'YYYY-MM-DD HH:mm',
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
      $scope.$on('refresh',function(){$scope.get_data();});

      $scope.fields = fields;
      $scope.get_data();
      
      $scope.testSev = "major";
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

      // create a new modal. Can't reuse one modal unforunately as the directive will not
      // re-render on show.
      /*
      $modal({
        template: './app/panels/table/modal.html',
        persist: false,
        show: true,
        scope: $scope.$new(),
        keyboard: false
      });
      */

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

    $scope.get_data = function(segment,query_id) {

      $scope.panel.error =  false;
      $scope.panelMeta.loading = true;
      
      $scope.panel.offset = 0;
      $scope.hits = 0;
      $scope.data = [];
      $scope.current_fields = [];

      // Get the list of jobs from the Prelert Engine API.
      // Paging behaviour is consistent with Kibana where it gets size*pages records 
      // in one query and then does client-side paging through query results.
      // TODO - implement skip for full paging functionality.
      var params = {
          take: $scope.panel.size*$scope.panel.pages
      };
      $scope.prelertjs.JobsService.listJobs(params)
      .success(function(results) {
          console.log('prelertjobtable jobs from JobService: ');
          console.log(results);
          
          $scope.panelMeta.loading = false;
          
          // This is exceptionally expensive, especially on events with a large number of fields
          $scope.data = $scope.data.concat(_.map(results.documents, function(hit) {
            var _h = _.clone(hit);

            // _source is kind of a lie here, never display it, only select values from it
            _h.kibana = {
              _source : kbn.flatten_json(_h)
            };

            // Kind of cheating with the _.map here, but this is faster than kbn.get_all_fields
            $scope.current_fields = $scope.current_fields.concat(_.keys(_h.kibana._source));
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
          $scope.panel.error = $scope.parse_error("Error loading list of jobs from the Prelert Engine API." +
                 "Please ensure the Engine API is running and configured correctly.");
          console.log('Error loading list of jobs from the Prelert Engine API: ' + error.message);
      });

    };
    
    $scope.show_results = function(event, jobId) {
        // Stop event propagation to prevent default row details expansion.
        event.stopPropagation();
        
        // Open the API Results dashboard, passing the job id as the URL jobId parameter.
        var params = {};
        params.jobId = jobId;
        var encodedParams = $.param(params);
        
        var targetUrl = '#/dashboard/file/prelert_api_results.json?' + encodedParams;  
        window.open(targetUrl,"_blank");
    };
    
    
    $scope.delete_job = function(event, jobId) {
        // Stop event propagation to prevent default row details expansion.
        event.stopPropagation();
        
        var dash = $scope.dashboard;
        
        var message="Are you sure you want to delete job id " + jobId + "?\nAll the results and configuration for this job will be deleted.";
        if (window.confirm(message)) {
            
            $scope.prelertjs.JobsService.deleteJob(jobId)
            .success(function(response) {
                console.log('prelertjobtable response from delete: ');
                console.log(response);
                
                $scope.dashboard.refresh();
            })
            .error(function (error) {
                $scope.panel.error = $scope.parse_error("Error deleting Prelert Engine API job." +
                       "Please ensure the Engine API is running and configured correctly.");
                console.log('Error deleting Prelert Engine API job: ' + error.message);
            });

        }
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

  });

});