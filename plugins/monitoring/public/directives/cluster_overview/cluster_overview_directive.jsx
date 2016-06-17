import React from 'react';
import Overview from './Overview';

const module = require('ui/modules').get('monitoring/directives', []);
module.directive('monitoringClusterOverview', function (kbnUrl) {
  return {
    restrict: 'E',
    scope: { cluster: '=' },
    link: function (scope, element) {
      React.render(<Overview scope={scope} kbnUrl={kbnUrl}></Overview>, element[0]);
    }
  };
});
