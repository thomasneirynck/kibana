import 'plugins/security/views/settings/users';
import 'plugins/security/views/settings/roles';
import 'plugins/security/views/settings/edit_user';
import 'plugins/security/views/settings/edit_role';
import chrome from 'ui/chrome';
import 'plugins/security/views/settings/settings.less';

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
