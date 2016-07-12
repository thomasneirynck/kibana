import React from 'react';
import Overview from './Overview';
import uiModules from 'ui/modules';

const mod = uiModules.get('monitoring/directives', []);
mod.directive('monitoringClusterOverview', function (kbnUrl) {
  return {
    restrict: 'E',
    scope: { cluster: '=' },
    link: function (scope, element) {
      React.render(<Overview scope={scope} kbnUrl={kbnUrl}></Overview>, element[0]);
    }
  };
});
