import {constant} from 'lodash';
import registry from 'ui/registry/chrome_nav_controls';
import template from 'plugins/security/views/nav_control/nav_control.html';

registry.register(constant({
  name: 'security',
  order: 1000,
  template
}));
