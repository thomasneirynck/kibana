import 'plugins/som/som.less';
import 'plugins/som/ponder/ponder.less';
import 'plugins/som/som_controller.js';
import 'plugins/som/som_directive.js';
import TemplateVisTypeTemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';
import somTemplate from 'plugins/som/som.html';

import somParamTemplate from 'plugins/som/som_params.html';
import visTypes from 'ui/registry/vis_types';

visTypes.register(SomProvider);

export default function SomProvider(Private) {

  const TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  return new TemplateVisType({
    name: 'som',
    title: 'Self Organizing Map',
    description: 'som description here',
    icon: 'fa-map-o',
    template: somTemplate,
    params: {
      defaults: {
      },
      editor: somParamTemplate
    },
    schemas: new Schemas([
      {
        group: 'metrics',
        name: 'metric',
        title: 'Metric',
        min: 1,
        aggFilter: ['avg', 'sum', 'count', 'min', 'max', 'median', 'cardinality'],
        defaults: [
          { schema: 'metric', type: 'count' }
        ]
      },
      {
        group: 'buckets',
        name: 'bucket',
        icon: 'fa fa-map-o',
        title: 'Tags',
        min: 1,
        max: 1,//we can relax this later. but it's harder to reason about non-metric args.
        aggFilter: ['terms', 'significant_terms']
      }
    ])
  });
};
