import pkg from '../../package.json';
import checkKbnVersion from './check_kbn_version';
import healthCheck from './es_client/health_check';

export default function pluginSelfCheck(plugin, server) {
  plugin.status.yellow('Waiting for Monitoring Health Check');
  // check if kibana is minimum supported version
  const {
    isKibanaSupported,
    kibanaVersion,
    monitoringVersion
  } = checkKbnVersion(plugin, pkg);

  if (isKibanaSupported) {
    healthCheck(plugin, server).start();
  } else {
    plugin.status.red(`version ${monitoringVersion} is not supported with Kibana ${kibanaVersion}`);
  }
};
