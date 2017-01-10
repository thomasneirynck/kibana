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
 * Ml influencer heatmap visualization displaying the relative sizes
 * of two metrics over two levels of aggregation buckets. Results can be
 * displayed in a treemap or a circle packing bubble chart. The visualization
 * is used in Ml dashboards to display the relative importance of the
 * different influencer types that have been configured for a job.
 */

import 'plugins/ml/influencerheatmap/influencerheatmap_controller.js';
import 'plugins/ml/influencerheatmap/influencerheatmap.less';

import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';

export default function InfluencerHeatmapVisType(Private) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  // Return a new instance describing this visualization.
  return new TemplateVisType({
    name: 'mlInfluencerHeatmap',
    title: 'Influencer heatmap',
    icon: 'fa-sitemap',
    description: 'Ml influencer heatmap visualization displaying the relative sizes ' +
      'of two metrics over two levels of aggregation buckets. Results can be ' +
      'displayed in a treemap or a circle packing bubble chart. The visualization ' +
      'is used in Ml dashboards to display the relative importance of the ' +
      'different influencer types that have been configured for a job.',
    template: require('plugins/ml/influencerheatmap/influencerheatmap.html'),
    params: {
      editor: require('plugins/ml/influencerheatmap/influencerheatmap_editor.html'),
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
