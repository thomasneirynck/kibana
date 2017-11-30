import React from 'react';
import ReactDOM from 'react-dom';
import { uiModules } from 'ui/modules';
import { Sparkline } from 'plugins/monitoring/components/sparkline';
import moment from 'moment';

const uiModule = uiModules.get('plugins/monitoring/directives', []);
uiModule.directive('sparkline', ($injector) => {
  const timefilter = $injector.get('timefilter');

  return {
    restrict: 'E',
    scope: {
      // See https://github.com/flot/flot/blob/master/API.md#data-format
      series: '=',

      // See https://github.com/flot/flot/blob/master/API.md#plot-options
      options: '=',
    },
    link(scope, $elem) {

      function onBrush(xaxis) {
        scope.$evalAsync(() => {
          timefilter.time.from = moment(xaxis.from);
          timefilter.time.to = moment(xaxis.to);
          timefilter.time.mode = 'absolute';
        });
      }

      scope.$watchGroup(['series', 'onBrush', 'options'], ([ series, options ]) => {
        ReactDOM.render(
          <Sparkline
            series={series}
            onBrush={onBrush}
            options={options}
          />,
          $elem[0]
        );
      });

      scope.$on('$destroy', () => ReactDOM.unmountComponentAtNode($elem[0]));
    }
  };
});
