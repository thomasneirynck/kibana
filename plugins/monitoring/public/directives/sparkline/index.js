import React from 'react';
import ReactDOM from 'react-dom';
import { uiModules } from 'ui/modules';
import { Sparkline } from 'plugins/monitoring/components/sparkline';

const uiModule = uiModules.get('plugins/monitoring/directives', []);
uiModule.directive('sparkline', () => {
  return {
    restrict: 'E',
    scope: {
      // See https://github.com/flot/flot/blob/master/API.md#data-format
      series: '=',

      // See https://github.com/flot/flot/blob/master/API.md#plot-options
      options: '=',
    },
    link(scope, $elem) {
      scope.$watchGroup(['series', 'options'], ([ series, options ]) => {
        ReactDOM.render(
          <Sparkline
            series={series}
            options={options}
          />,
          $elem[0]
        );
      });

      scope.$on('$destroy', () => ReactDOM.unmountComponentAtNode($elem[0]));
    }
  };
});
