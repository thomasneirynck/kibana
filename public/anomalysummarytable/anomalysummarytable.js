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
  const Schemas = Private(VisSchemasProvider);;

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