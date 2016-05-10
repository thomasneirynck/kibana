import _ from 'lodash';
const mod = require('ui/modules').get('monitoring/title', []);

mod.service('title', (Private) => {
  const docTitle = Private(require('ui/doc_title'));
  return function changeTitle(cluster, suffix) {
    let clusterName = _.get(cluster, 'cluster_name');
    clusterName = (clusterName) ? `- ${clusterName}` : '';
    suffix = (suffix) ? `- ${suffix}` : '';
    docTitle.change(`Monitoring ${clusterName} ${suffix}`, true);
  };
});
