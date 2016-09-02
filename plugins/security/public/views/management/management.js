import 'plugins/security/views/management/users';
import 'plugins/security/views/management/roles';
import 'plugins/security/views/management/edit_user';
import 'plugins/security/views/management/edit_role';
import 'plugins/security/views/management/management.less';
import routes from 'ui/routes';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import '../../services/shield_user';

import management from 'ui/management';

routes.defaults(/\/management/, {
  resolve: {
    securityManagementSection: function (ShieldUser, Private) {
      const xpackInfo = Private(XPackInfoProvider);
      const elasticsearch = management.getSection('elasticsearch');
      const showSecurityLinks = xpackInfo.get('features.security.showLinks');

      elasticsearch.deregister('users');
      elasticsearch.deregister('roles');

      return ShieldUser.getCurrentUser().$promise
      .then(() => {
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
      });
    }
  }
});
