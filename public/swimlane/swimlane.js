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
 * Swimlane visualization, displaying the behavior of a metric over time across
 * different values of fields in Prelert results.
 */


import 'plugins/prelert/swimlane/swimlane_controller.js';
import 'plugins/prelert/swimlane/swimlane.less';

import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';

var module = require('ui/modules').get('prelert/swimlane');

module.run(function($templateCache) {
  // Load the templates into the cache for quick retrieval.
  $templateCache.put('plugins/prelert/swimlane/swimlane.html', require('plugins/prelert/swimlane/swimlane.html'));
  $templateCache.put('plugins/prelert/swimlane/swimlane_editor.html', require('plugins/prelert/swimlane/swimlane_editor.html'));
});

export default function SwimlaneVisType(Private, $templateCache) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  return new TemplateVisType({
    name: 'prlSwimlane',
    title: 'Prelert Swimlane',
    icon: 'fa-bars', 
    description: 'Prelert visualization displaying the behavior of a metric '+
      'over time across Prelert jobs, or fields from influencer or record type results, in a swimlane chart.',
    template: $templateCache.get('plugins/prelert/swimlane/swimlane.html'), 
    params: {
      editor: $templateCache.get('plugins/prelert/swimlane/swimlane_editor.html'), 
      defaults: { 
        interval: {display:'Auto', val:'auto'},
        mode: 'jobs',   // jobs, influencers or records
        viewBy: {field:'jobId', label:'Job ID'},
        showViewByControl: true
      },
      jobViewByOptions: [{field:'jobId', label:'Job ID'},
                 {field:'jobId', label:'Job description'}],
      influencerViewByOptions: [{field:'influencerFieldName', label:'Influencer type'}],
      recordViewByOptions: [{field:'detectorIndex', label:'detector'}],
      intervalOptions: [{display:'Auto', val:'auto'},
                {display:'5 minutes', val:'custom', customInterval:'5m'},
                {display:'10 minutes', val:'custom', customInterval:'10m'},
                {display:'30 minutes', val:'custom', customInterval:'30m'},
                {display:'1 hour', val:'h'},
                {display:'3 hours', val:'custom', customInterval:'3h'},
                {display:'12 hours', val:'custom', customInterval:'12h'},
                {display:'1 day', val:'d'}]
    },
    schemas: new Schemas([
      {
        group: 'metrics',
        name: 'metric',
        title: 'Value',
        min: 1,
        max: 1,
        aggFilter: ['count', 'avg', 'sum', 'min', 'max']
      },
      {
        group: 'buckets',
        name: 'viewBy',
        icon: 'fa fa-eye',
        title: 'View by',
        mustBeFirst: true,
        min: 1,
        max: 1,
        aggFilter: 'terms'
      },
      {
        group: 'buckets',
        name: 'secondaryViewBy',
        icon: 'fa fa-eye',
        title: 'Secondary view by',
        min: 0,
        max: 1,
        aggFilter: 'terms'
      },
      {
        group: 'buckets',
        name: 'timeSplit',
        icon: 'fa fa-th',
        title: 'Time field',
        min: 1,
        max: 1,
        aggFilter: 'date_histogram'
      }
    ])
  });
};



