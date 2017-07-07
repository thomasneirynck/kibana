import _ from 'lodash';
import { uiModules } from 'ui/modules';
import uiRoutes from 'ui/routes';
import 'ui/autoload/all';
import 'plugins/monitoring/less/main.less';
import 'plugins/monitoring/filters';
import 'plugins/monitoring/services/clusters';
import 'plugins/monitoring/services/features';
import 'plugins/monitoring/services/executor';
import 'plugins/monitoring/services/license';
import 'plugins/monitoring/services/title';
import 'plugins/monitoring/services/breadcrumbs';
import 'plugins/monitoring/directives';
import 'plugins/monitoring/views';

const uiModule = uiModules.get('kibana');
uiModule.run(function (uiSettings) {
  _.set(uiSettings, 'defaults.timepicker:timeDefaults.value', JSON.stringify({
    from: 'now-1h',
    to: 'now',
    mode: 'quick'
  }));
  _.set(uiSettings, 'defaults.timepicker:refreshIntervalDefaults.value', JSON.stringify({
    display: '10 seconds',
    pause: false,
    value: 10000
  }));
});

// Enable Angular routing
uiRoutes.enable();
