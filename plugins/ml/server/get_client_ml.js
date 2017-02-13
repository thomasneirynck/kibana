import { once } from 'lodash';
import esMl from './elasticsearch-ml';

export default once((server) => {
  const config = Object.assign({ plugins: [esMl] }, server.config().get('elasticsearch'));
  const cluster = server.plugins.elasticsearch.createCluster('ml', config);

  return cluster;
});
