import {constant} from 'lodash';
import registry from 'ui/registry/chrome_nav_controls';
import template from 'plugins/security/views/logout_button/logout_button.html';

registry.register(constant({
  name: 'logout button',
  order: 1000,
  template
}));
