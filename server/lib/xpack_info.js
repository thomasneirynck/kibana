/* Call the XPack Info API
 * Requires and authenticated client
 */
export default function xpackInfo(client) {
  return client.transport.request({
    method: 'GET',
    path: '_xpack'
  })
  .then(response => {
    return {
      features: response.features
    };
  });
};

/*
{ features:
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
        enabled: true } } }
 */
