import uiModules from 'ui/modules';

const module = uiModules.get('shield', []);
module.constant('defaultRoles', [
  'admin',
  'power_user',
  'user',
  'transport_client',
  'kibana4',
  'kibana4_server',
  'logstash',
  'marvel_user',
  'remote_marvel_agent'
]);
