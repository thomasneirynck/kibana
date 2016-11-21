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
 * Prelert influencer heatmap visualization displaying the relative sizes
 * of two metrics over two levels of aggregation buckets. Results can be
 * displayed in a treemap or a circle packing bubble chart. The visualization
 * is used in Prelert dashboards to display the relative importance of the
 * different influencer types that have been configured for a job.
 */
    
import 'plugins/prelert/influencerheatmap/influencerheatmap_controller.js';
import 'plugins/prelert/influencerheatmap/influencerheatmap.less';

import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';

export default function InfluencerHeatmapVisType(Private) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  // Return a new instance describing this visualization.
  return new TemplateVisType({
    name: 'prlInfluencerHeatmap',
    title: 'Influencer heatmap',
    icon: 'fa-sitemap', 
    description: 'Prelert influencer heatmap visualization displaying the relative sizes ' +
      'of two metrics over two levels of aggregation buckets. Results can be ' +
      'displayed in a treemap or a circle packing bubble chart. The visualization ' +
      'is used in Prelert dashboards to display the relative importance of the ' +
      'different influencer types that have been configured for a job.',
    template: require('plugins/prelert/influencerheatmap/influencerheatmap.html'),
    params: {
      editor: require('plugins/prelert/influencerheatmap/influencerheatmap_editor.html'), 
      defaults: { 
        chartType: 'treemap'
      }
    },
    schemas: new Schemas([
      {
        group: 'metrics',
        name: 'sizeBy',
        title: 'Size by metric',
        mustBeFirst: true,
        min: 1,
        max: 1,
        aggFilter: ['count', 'avg', 'sum', 'min', 'max']
      },
      {
        group: 'metrics',
        name: 'colorBy',
        title: 'Color by (0 to 100)',
        min: 1,
        max: 1,
        aggFilter: ['count', 'avg', 'sum', 'min', 'max']
      },
      {
        group: 'buckets',
        name: 'viewBy1',
        icon: 'fa fa-eye',
        title: 'First split by',
        mustBeFirst: true,
        min: 1,
        max: 1,
        aggFilter: 'terms'
      },
      {
        group: 'buckets',
        name: 'viewBy2',
        icon: 'fa fa-eye',
        title: 'Second split by',
        min: 1,
        max: 1,
        aggFilter: 'terms'
      }
    ])
  });
};
  