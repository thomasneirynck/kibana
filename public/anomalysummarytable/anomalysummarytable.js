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
 * Prelert anomaly summary table visualization.
 */

import 'plugins/prelert/anomalysummarytable/anomalysummarytable_controller.js';
import 'plugins/prelert/anomalysummarytable/anomalysummarytable.less';

import 'plugins/prelert/services/job_service';
import 'plugins/prelert/services/results_service';

import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';

export default function AnomalySummaryTableVisType(Private) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  // Return a new instance describing this visualization.
  return new TemplateVisType({
    name: 'prlAnomalySummaryTable',
    title: 'Anomaly Summary',
    icon: 'fa-table',
    description: 'Prelert anomaly summary visualization displaying ' +
      'a summary of anomaly records.',
    template: require('plugins/prelert/anomalysummarytable/anomalysummarytable.html'),
    params: {
      editor: require('plugins/prelert/anomalysummarytable/anomalysummarytable_editor.html'),
      defaults: {
        threshold: {display:'minor', val:25},
        interval: {display:'Auto', val:'auto'}
      },
      thresholdOptions: [{display:'critical', val:75},
                         {display:'major', val:50},
                         {display:'minor', val:25},
                         {display:'warning', val:0}],
      intervalOptions: [{display:'Auto', val:'auto'},
                        {display:'1 hour', val:'hour'},
                        {display:'1 day', val:'day'},
                        {display:'Show all', val:'second'}]
    }
  });
};