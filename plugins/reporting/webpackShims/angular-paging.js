require('jquery');
require('angular');
require('../../../node_modules/angular-paging/dist/paging');

const { uiModules } = require('ui/modules');
uiModules.get('kibana', ['bw.paging']);
