import 'plugins/security/views/management/users';
import 'plugins/security/views/management/roles';
import 'plugins/security/views/management/edit_user';
import 'plugins/security/views/management/edit_role';
import 'plugins/security/views/management/management.less';
import routes from 'ui/routes';

import management from 'ui/management';

routes.defaults(/\/management/, {
  resolve: {
    managementSection: function (ShieldUser) {
      const elasticsearch = management.getSection('elasticsearch');
      const showSecurityLinks = !!ShieldUser.getCurrent();

      elasticsearch.deregister('users');
      elasticsearch.deregister('roles');
      if (showSecurityLinks) {
        elasticsearch.register('users', {
          order: 10,
          display: 'Users',
          url: '#/management/elasticsearch/users'
        });

        elasticsearch.register('roles', {
          order: 20,
          display: 'Roles',
          url: '#/management/elasticsearch/roles'
        });
      }
    }
  }
});
