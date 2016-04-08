import uiModules from 'ui/modules';

const module = uiModules.get('shield', []);
module.constant('shieldPrivileges', {
  cluster: [
    'all',
    'monitor',
    'manage',
    'manage_security',
    'manage_index_templates',
    'transport_client',
  ],
  indices: [
    'all',
    'manage',
    'monitor',
    'read',
    'index',
    'create',
    'delete',
    'write',
    'delete_index',
    'create_index'
  ]
});
