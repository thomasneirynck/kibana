import './som.less';
import './ponder/ponder.less';
import './som_controller.js';
// import './som_directive.js';

import image from '../../region_map/public/images/icon-vector-map.svg';

import somControllerTemplate from './som_controller.html';
import {VisFactoryProvider} from 'ui/vis/vis_factory';
import {CATEGORY} from 'ui/vis/vis_category';
import {VisSchemasProvider} from 'ui/vis/editors/default/schemas';
import {VisTypesRegistryProvider} from 'ui/registry/vis_types';


VisTypesRegistryProvider.register(function SomProvider(Private) {

  console.log('kachine');
  const VisFactory = Private(VisFactoryProvider);
  const Schemas = Private(VisSchemasProvider);
  console.log('kachin as');


  return VisFactory.createAngularVisualization({
    name: 'som',
    title: 'Self Organizing Map',
    image: image,
    implementsRenderComplete: false,
    description: 'Create conceptual maps of data. This places related elements closer together, while it places dissimilar items further away.',
    category: CATEGORY.OTHER,
    visConfig: {
      template: somControllerTemplate
    },
    editorConfig: {
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
          title: 'Select feature',
          min: 1,
          aggFilter: ['terms']
        },
        {
          group: 'buckets',
          name: 'bucket',
          icon: 'fa fa-map-o',
          title: 'Add tags',
          aggFilter: ['terms', 'significant_terms']
        }
      ])
    }
  });
});
