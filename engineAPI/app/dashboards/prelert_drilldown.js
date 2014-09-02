/*
 ************************************************************
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

/*
 * Complex scripted dashboard, based on Kibana's logstash.js dashboard, designed
 * primarily for drilling down into anomalies detected by the Prelert Engine API
 * to show the raw log data indexed in Elasticsearch by logstash.
 * 
 * The dashboard takes a number of optional, user supplied, URL parameters, which are
 * used to set the index, search and time range, and to configure the histogram and
 * table displayed in the dashboard.
 *
 * index :: Which index to search? If this is specified, interval is set to 'none'.
 * pattern :: Does nothing if index is specified. Set a timestamped index pattern. Default: [logstash-]YYYY.MM.DD
 * interval :: Sets the index interval (eg: day,week,month,year), Default: day
 *
 * split :: The character to split the queries on Default: ','
 * query :: By default, a comma separated list of queries to run. Default: *
 * filters :: Optional list of filters, in JSON format, for example: [{"response":"503"},{"host":"webserver1.acme.com"}]
 *
 * from :: Starting time to filter on, for example 2013-01-30T16:00:00.000+00:00. Defaults to 'now-1d' if not specified.
 * to :: Finishing time to filter on, for example 2013-01-30T17:00:00.000+00:00. Defaults to 'now' if not specified.
 * timefield :: The field containing the time to filter on, Default: @timestamp
 * 
 * func :: The analytical function in which the Engine API has found the anomaly to occur. If 'mean','avg','min','max' 
 *         or 'sum', the histogram will plot the corresponding metric. Otherwise event count will be plotted. 
 * fieldName :: Used in combination with metric values of 'func' ('mean','avg','min','max') to set the value
 *         field for the histogram plot.
 *
 * fields :: comma separated list of fields to show in the table
 * sort :: comma separated field to sort on, and direction, eg sort=@timestamp,desc
 *
 */

'use strict';
// Setup some variables
var dashboard, queries, _d_timespan;

// All url parameters are available via the ARGS object
var ARGS;

// Set a default timespan if one isn't specified
_d_timespan = '1d';

// Intialize a skeleton with nothing but a rows array and service object
dashboard = {
  rows : [],
  services : {}
};

// Set a title
dashboard.title = 'Engine API Drilldown Search';

// Allow the user to set the index, if they don't, fall back to logstash.
if(!_.isUndefined(ARGS.index)) {
  dashboard.index = {
    default: ARGS.index,
    interval: 'none'
  };
} else {
  // Don't fail to default
  dashboard.failover = false;
  dashboard.index = {
    default: 'ADD_A_TIME_FILTER',
    pattern: ARGS.pattern||'[logstash-]YYYY.MM.DD',
    interval: ARGS.interval||'day'
  };
}

dashboard.nav = [
        {
          type: "timepicker",
          collapse: false,
          notice: false,
          enable: true,
          status: "Stable",
          time_options: [
            "5m",
            "15m",
            "1h",
            "6h",
            "12h",
            "24h",
            "2d",
            "7d",
            "30d"
          ],
          refresh_intervals: [
            "5s",
            "10s",
            "30s",
            "1m",
            "5m",
            "15m",
            "30m",
            "1h",
            "2h",
            "1d"
          ],
          timefield: ARGS.timefield||"@timestamp",
          now: false
        }
      ];

// In this dashboard we let users pass queries as comma separated list to the query parameter.
// Or they can specify a split character using the split parameter
// If query is defined, split it into a list of query objects
// NOTE: ids must be integers, hence the parseInt()s
if(!_.isUndefined(ARGS.query)) {
  queries = _.object(_.map(ARGS.query.split(ARGS.split||','), function(v,k) {
    return [k,{
      query: v,
      id: parseInt(k,10),
      alias: v
    }];
  }));
} else {
  // No queries passed? Initialize a single query to match everything
  queries = {
    0: {
      query: '*',
      id: 0,
    }
  };
}

// Now populate the query service with our objects
dashboard.services.query = {
  list : queries,
  ids : _.map(_.keys(queries),function(v){return parseInt(v,10);})
};

// Lets also add a default time filter, the value of which can be specified by the user
dashboard.services.filter = {
   
  list: {
    0: {
      from: (ARGS.from||"now-"+ _d_timespan),
      to: (ARGS.to||"now"),
      field: ARGS.timefield||"@timestamp",
      type: "time",
      active: true,
      id: 0,
    }
  },
  ids: [0]
};

if (ARGS.filters) {
 
    // Parse the JSON 'filters' parameter, and add a filter for each.
    var filters = JSON.parse(ARGS.filters);
    console.log(filters);
    
    _.each(filters, function(filter){
        var keys = _.keys(filter);
        _.each(keys, function(filterName){
            // Convert each filter query to a JSON string so that values are quoted.
            // Note use JSON.stringify(value) rather than angular.toJson(value) as
            // Kibana's dashboard.js script_load() function annoyingly does not pass
            // angular to the scriped dashboard.
            dashboard.services.filter.list[dashboard.services.filter.ids.length.toString()] = {
                type: "field",
                field: filterName,
                query: JSON.stringify(filter[filterName]),
                mandate: "must",
                active: true,
                alias: "",
                id: dashboard.services.filter.ids.length,
            };
            dashboard.services.filter.ids.push(dashboard.services.filter.ids.length);
        });
        
        
    });
    
}

// Ok, lets make some rows. The Filters row is collapsed by default
dashboard.rows = [
  {
    title: "Chart",
    height: "300px"
  },
  {
    title: "Events",
    height: "400px"
  }
];

// And a histogram that allows the user to specify the interval and time field.
// Plot either metric or count depending on function arg passed to the dashboard.
var metricFunctions = ['mean','avg','min','max','sum'];
if (_.contains(metricFunctions, ARGS.func) && !_.isUndefined(ARGS.fieldName)) {
    dashboard.rows[0].panels = [
        {
          title: 'metric over time',
          type: 'histogram',
          time_field: ARGS.timefield||"@timestamp",
          auto_int: true,
          span: 12,
          mode: 'min',
          value_field: ARGS.fieldName,
          lines: true,
          bars: false,
          fill: 1,
          linewidth: 3,
          points: false,
          pointradius: 5,
          zerofill: false,
        }
    ];
    
    if (ARGS.func == 'mean' || ARGS.func == 'avg') {
        dashboard.rows[0].panels[0]['mode'] = 'mean';
    }
    else if (ARGS.func == 'sum') {
        dashboard.rows[0].panels[0]['mode'] = 'total';
    }
    else if (ARGS.func == 'min' || ARGS.func == 'max') {
        dashboard.rows[0].panels[0]['mode'] = ARGS.func;
    }
    else {
        dashboard.rows[0].panels[0]['mode'] = 'count';
    }
    
}
else {
    dashboard.rows[0].panels = [
        {
          title: 'events over time',
          type: 'histogram',
          time_field: ARGS.timefield||"@timestamp",
          auto_int: true,
          span: 12
        }
    ];
}

// And a table row where you can specify field and sort order
dashboard.rows[1].panels = [
  {
    title: 'all events',
    type: 'table',
    fields: !_.isUndefined(ARGS.fields) ? ARGS.fields.split(',') : [],
    sort: !_.isUndefined(ARGS.sort) ? ARGS.sort.split(',') : [ARGS.timefield||'@timestamp','desc'],
    overflow: 'expand',
    span: 12
  }
];

// Now return the object and we're good!
return dashboard;

