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
 * Prelert visualization displaying a list of the top scores by
 * specified attribute value for the selected Prelert job(s).
 */

import 'plugins/prelert/topscorestable/topscorestable_controller.js';
import 'plugins/prelert/topscorestable/topscorestable.less';

import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';

export default function TopScoresTableVisType(Private) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  // Return a new instance describing this visualization.
  return new TemplateVisType({
    name: 'prlTopScoresTable',
    title: 'Top scores',
    icon: 'fa-sort-amount-desc',
    description: 'Prelert visualization designed to display a list of the top anomaly ' +
      'scores by an attribute value, such as influencer, job ID or time, across Prelert jobs.',
    template: require('plugins/prelert/topscorestable/topscorestable.html'),
    params: {
      editor: require('plugins/prelert/topscorestable/topscorestable_editor.html')
    },
    schemas: new Schemas([
      {
        group: 'metrics',
        name: 'value',
        title: 'Value',
        mustBeFirst: true,
        min: 1,
        max: 1,
        aggFilter: ['count', 'avg', 'sum', 'min', 'max']
      },
      {
        group: 'buckets',
        name: 'viewBy',
        icon: 'fa fa-eye',
        title: 'Split by',
        mustBeFirst: true,
        min: 1,
        max: 1,
        aggFilter: 'terms'
      }
    ])
  });
};

