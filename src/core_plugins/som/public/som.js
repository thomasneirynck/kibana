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
    description: 'Create conceptual maps of data. This places related elements closer together, while it places dissimilar items further away.',
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
        aggFilter: ['sum', 'min', 'max', 'count']
      },
      {
        group: 'buckets',
        name: 'bucket',
        icon: 'fa fa-map-o',
        title: 'Tags',
        min: 1,
        aggFilter: ['terms', 'significant_terms']
      }
    ])
  });
};
