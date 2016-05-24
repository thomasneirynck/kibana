import registry from 'ui/registry/settings_sections';

import 'plugins/reporting/views/settings/jobs';

registry.register(() => {
  return {
    order: 20,
    name: 'reporting',
    display: 'Reporting',
    url: '#/settings/reporting/jobs'
  };
});
