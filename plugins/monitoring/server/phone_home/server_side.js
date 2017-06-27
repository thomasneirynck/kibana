import { PhoneHomeManager } from './manager';
import { PhoneHomeSender } from './sender';

/**
 * Spawn the background worker that runs at-most once a day to report stats
 * from the server.
 *
 * This will wait to run 5 minutes after successful startup of monitoring to
 * avoid spam, and then 24 hours afterward.
 *
 * @param {Object} server The server object to fetch the client connections.
 */
export function initPhoneHomeServerSide(server) {
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('admin');
  const uiSettings = server.uiSettingsServiceFactory({ callCluster: callWithInternalUser });
  const manager = new PhoneHomeManager(server, uiSettings, new PhoneHomeSender(server));
  // we either need to wrap it or pass it in as `manager.sendIfDue.bind(manager)`
  const trigger = () => manager.sendIfDue();
  let poller = null;

  server.plugins.monitoring.status.on('green', () => {
    if (!poller) {
      // check (not send) every 5 minutes in milliseconds
      poller = setInterval(trigger, 5 * 60 * 60 * 1000);
    }
  });

  server.plugins.monitoring.status.on('red', () => {
    clearInterval(poller);
    poller = null;
  });
}
