import { once } from 'lodash';
import { alertLoader } from './lib/alert_loader';
// In the future, it may become desirable to initialize this separatey from cluster alerts, but currently nothing else needs it
import { initMonitoringXpackInfo } from '../lib/init_monitoring_xpack_info';
import { checkLicenseGenerator } from './check_license';

export function initClusterAlerts(serverInfo, server) {
  const config = server.config();
  const pollFrequencyInMillis = config.get('xpack.monitoring.cluster_alerts.management.interval');

  return initMonitoringXpackInfo(server, pollFrequencyInMillis, 'monitoring')
  .then(info => {
    server.expose('info', info); // expose info object as server.plugins.monitoring.info
    server.plugins.monitoring.info.feature('monitoring').registerLicenseCheckResultsGenerator(checkLicenseGenerator);

    // if we don't need to manage cluster alerts, then we're done by just checking for X-Pack (which is needed for UI checks)
    if (config.get('xpack.monitoring.cluster_alerts.management.enabled')) {
      const loader = alertLoader(serverInfo, server);
      const loadImmediatelyOnce = once(loader.trigger);
      let poller;

      server.plugins.monitoring.status.on('green', () => {
        poller = setInterval(loader.trigger, pollFrequencyInMillis);

        // don't wait 5m (default) to load watches the first time
        loadImmediatelyOnce();
      });

      server.plugins.monitoring.status.on('red', () => {
        clearInterval(poller);
      });
    }
  });
}
