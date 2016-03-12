import { filter } from 'lodash';
import { satisfies } from 'semver';
import processVersionString from '../process_version_string';

export default function checkEsVersion(server) {
  const client = server.plugins.monitoring.client;
  const engineVersion = server.config().get('monitoring.elasticsearch.engineVersion');
  return client.nodes.info()
  .then(info => {
    const badNodes = filter(info.nodes, function (node) {
      try {
        const ver = processVersionString(node.version);
        return !satisfies(ver, engineVersion);
      } catch (err) {
        return false;
      }
    });
    if (!badNodes.length) return true; // no bad nodes, all is ok

    const badNodeNames = badNodes.map(function (node) {
      return 'Elasticsearch v' + node.version + ' @ ' + node.http_address + ' (' + node.ip + ')';
    });

    const message = `This version of Monitoring requires Elasticsearch ` +
    `${engineVersion} on all nodes. I found ` +
    `the following incompatible nodes in your cluster: ${badNodeNames.join(',')}`;

    throw new Error(message);
  });
};
