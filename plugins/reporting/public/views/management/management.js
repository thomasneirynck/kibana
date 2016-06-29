import management from 'ui/management';

import 'plugins/reporting/views/management/jobs';

management.getSection('kibana').register('reporting', {
  order: 15,
  display: 'Reporting',
  url: '#/management/kibana/reporting'
});
