/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

/*
 * Visualization consisting of two swimlanes, designed to show the maximum score by job,
 * and the maximum anomaly score by influencer type, from Ml results over time.
 */

import 'plugins/ml/summaryswimlanes/summaryswimlanes_controller.js';
import 'plugins/ml/summaryswimlanes/summaryswimlanes.less';
import 'plugins/ml/swimlane/swimlane.less';    // Uses common tooltip styles.

import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';

const module = require('ui/modules').get('ml/summaryswimlanes');

module.run(function ($templateCache) {
  // Load the templates into the cache for quick retrieval.
  $templateCache.put('plugins/ml/summaryswimlanes/summaryswimlanes.html',
    require('plugins/ml/summaryswimlanes/summaryswimlanes.html'));
  $templateCache.put('plugins/ml/summaryswimlanes/summaryswimlanes_editor.html',
    require('plugins/ml/summaryswimlanes/summaryswimlanes_editor.html'));
});

export default function SummarySwimlanesVisType(Private, $templateCache) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  // Return a new instance describing this visualization.
  return new TemplateVisType({
    name: 'mlSummarySwimlanes',
    title: 'Job Swimlanes',
    icon: 'fa-bars',
    description: 'Ml visualization consisting of two swimlanes, designed to show the ' +
      'maximum anomaly score by job, and the maximum anomaly score by influencer type, over time.',
    template: $templateCache.get('plugins/ml/summaryswimlanes/summaryswimlanes.html'),
    params: {
      editor: $templateCache.get('plugins/ml/summaryswimlanes/summaryswimlanes_editor.html'),
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
