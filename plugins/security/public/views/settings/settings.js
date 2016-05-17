import {constant} from 'lodash';
import registry from 'ui/registry/settings_sections';
import 'plugins/security/views/settings/users';
import 'plugins/security/views/settings/roles';
import 'plugins/security/views/settings/edit_user';
import 'plugins/security/views/settings/edit_role';
import chrome from 'ui/chrome';

if (chrome.getInjected('showSecurityFeatures')) {
  registry.register(constant({
    order: 10,
    name: 'security',
    display: 'Security',
    url: '#/settings/security/users'
  }));
}
