import {constant} from 'lodash';
import registry from 'ui/registry/settings_sections';
import routes from 'ui/routes';
import template from 'plugins/shield/views/settings/settings.html';

routes.when('/settings/security', {
  template,
  controller: function ($scope) {}
});

registry.register(constant({
  order: 10,
  name: 'security',
  display: 'Security',
  url: '#/settings/security'
}));
