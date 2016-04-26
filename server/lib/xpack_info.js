/* Call the XPack Info API
 * Requires and authenticated client
 *
 * Format of the data object returned:
{ build: { hash: '${buildNumber}', timestamp: 'NA' },
  license:
   { uid: '568d37aa-488d-4892-8caf-6ba8e75c145b',
     type: 'trial',
     mode: 'trial',
     status: 'active',
     expiry_date_in_millis: 1464218126589 },
  features:
   { graph:
      { description: 'Graph Data Exploration for the Elastic Stack',
        available: true,
        enabled: true },
     monitoring:
      { description: 'Monitoring for the Elastic Stack',
        available: true,
        enabled: true },
     security:
      { description: 'Security for the Elastic Stack',
        available: true,
        enabled: true },
     watcher:
      { description: 'Alerting, Notification and Automation for the Elastic Stack',
        available: true,
        enabled: true } },
  tagline: 'You know, for X' }
 */
export default function xpackInfo(client) {
  return client.transport.request({
    method: 'GET',
    path: '_xpack'
  });
};
