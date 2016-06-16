import 'plugins/security/views/management/users';
import 'plugins/security/views/management/roles';
import 'plugins/security/views/management/edit_user';
import 'plugins/security/views/management/edit_role';
import chrome from 'ui/chrome';
import 'plugins/security/views/management/management.less';

import management from 'ui/management';

if (chrome.getInjected('showSecurityFeatures')) {
  const elasticsearch = management.getSection('elasticsearch');

  elasticsearch.register('users', {
    order: 10,
    display: 'Users',
    path: 'elasticsearch/users'
  });

  elasticsearch.register('roles', {
    order: 20,
    display: 'Roles',
    path: 'elasticsearch/roles'
  });
}
