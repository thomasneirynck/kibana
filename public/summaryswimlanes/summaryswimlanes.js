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
 * Visualization consisting of two swimlanes, designed to show the maximum score by job,
 * and the maximum anomaly score by influencer type, from Prelert results over time.
 */

import 'plugins/prelert/summaryswimlanes/summaryswimlanes_controller.js';
import 'plugins/prelert/summaryswimlanes/summaryswimlanes.less';
import 'plugins/prelert/swimlane/swimlane.less';    // Uses common tooltip styles.

import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';

var module = require('ui/modules').get('prelert/summaryswimlanes');

module.run(function($templateCache) {
  // Load the templates into the cache for quick retrieval.
  $templateCache.put('plugins/prelert/summaryswimlanes/summaryswimlanes.html', require('plugins/prelert/summaryswimlanes/summaryswimlanes.html'));
  $templateCache.put('plugins/prelert/summaryswimlanes/summaryswimlanes_editor.html', require('plugins/prelert/summaryswimlanes/summaryswimlanes_editor.html'));
});

export default function SummarySwimlanesVisType(Private, $templateCache) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  // Return a new instance describing this visualization.
  return new TemplateVisType({
    name: 'prlSummarySwimlanes',
    title: 'Job Swimlanes',
    icon: 'fa-bars', 
    description: 'Prelert visualization consisting of two swimlanes, designed to show the ' +
      'maximum anomaly score by job, and the maximum anomaly score by influencer type, over time.',
    template: $templateCache.get('plugins/prelert/summaryswimlanes/summaryswimlanes.html'), 
    params: {
      editor: $templateCache.get('plugins/prelert/summaryswimlanes/summaryswimlanes_editor.html'), 
      defaults: { 
          interval: {display:'Auto', val:'auto'}
      },
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
