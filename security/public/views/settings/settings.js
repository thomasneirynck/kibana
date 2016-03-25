import {constant} from 'lodash';
import registry from 'ui/registry/settings_sections';
import 'plugins/shield/views/settings/users';
import 'plugins/shield/views/settings/roles';
import 'plugins/shield/views/settings/edit_user';
import 'plugins/shield/views/settings/edit_role';

registry.register(constant({
  order: 10,
  name: 'security',
  display: 'Security',
  url: '#/settings/security/users'
}));
