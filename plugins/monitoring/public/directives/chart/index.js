import _ from 'lodash';
import numeral from 'numeral';
import $ from 'jquery';
import moment from 'moment';
import VislibComponentsColorColorPaletteProvider from 'ui/vislib/components/color/color_palette';
import uiModules from 'ui/modules';
import template from 'plugins/monitoring/directives/chart/index.html';
import 'flot-charts/jquery.flot';
import 'flot-charts/jquery.flot.time';
import 'flot-charts/jquery.flot.canvas';
import 'flot-charts/jquery.flot.symbol';
import 'flot-charts/jquery.flot.crosshair';
import 'flot-charts/jquery.flot.selection';

const appColors = Object.freeze({
  elasticsearch: '#3ebeb0',
  kibana: '#e8488b'
});

function get(series, attr) {
  return _.chain(series).pluck(attr).last().value();
}

const uiModule = uiModules.get('plugins/monitoring/directives', []);
uiModule.directive('monitoringChart', () => {
  return {
    restrict: 'E',
    template,
    scope: {
      series: '='
    },
    link($scope) {
      $scope.$watch('series', series => {
        const seriesGet = _.partial(get, series);

        $scope.title = (() => {
          const title = seriesGet('metric.title');
          if (title) return title;
          return seriesGet('metric.label');
        }());

        $scope.units = (() => {
          let units = seriesGet('metric.units');

          // For Bytes, find the largest unit from any data set's _last_ item
          if (units === 'B') {
            let maxLastBytes = 0;
            _.forEach(series, (s) => {
              const last = _.last(s.data);
              maxLastBytes = Math.max(maxLastBytes, last && last.y || 0);
            });

            units = numeral(maxLastBytes).byteUnits();
          }

          return units;
        }());

        // Commenting because some descriptions are wrong. If they are
        // corrected, they can be shown in the UI as title text in the header
        // $scope.description = seriesGet('metric.description');
      });
    }
  };
});

uiModule.directive('chart', ($compile, $rootScope, timefilter, $timeout, Private) => {
  const getColors = Private(VislibComponentsColorColorPaletteProvider);

  return {
    restrict: 'E',
    scope: {
      series: '=',
    },
    link: ($scope, $elem) => {
      let legendValueNumbers;
      let debouncedSetLegendNumbers;
      const defaultOptions = {
        canvas: true,
        xaxis: {
          mode: 'time',
          timezone: 'browser'
        },
        selection: {
          mode: 'x',
          color: '#ccc'
        },
        crosshair: {
          mode: 'x',
          color: '#C66',
          lineWidth: 2
        },
        grid: {
          backgroundColor: '#FFF',
          borderWidth: {
            top: 0,
            right: 0,
            left: 0,
            bottom: 2
          },
          borderColor: {
            top: null,
            right: null,
            left: null,
            bottom: '#CCC'
          },
          margin: 10,
          hoverable: true,
          autoHighlight: false
        },
        legend: {
          position: 'nw',
          labelBoxBorderColor: 'rgba(255,255,255,0)',
          labelFormatter: (label, _series) => {
            return '<span class="ngLegendValue">' +
              label +
              '<span class="ngLegendValueNumber"></span></span>';
          }
        },
        yaxes: [ {}, { position: 'right' } ]
      };

      $(window).resize(() => {
        if (!$scope.plot) return;
        $timeout(() => {
          // This is a lot faster than calling $.plot(); Stolen from the borked flot.resize plugin
          $scope.plot.resize();
          $scope.plot.setupGrid();
          $scope.plot.draw();
        }, 0);
      });

      $scope.$on('$destroy', () => {
        $(window).off('resize'); //remove the handler added earlier
        $elem.off('plothover');
        $elem.off('plotselected');
        $elem.off('mouseleave');
      });

      $elem.on('plothover',  (event, pos, item) => {
        $rootScope.$broadcast('monitoringPlotHover', event, pos, item);
      });

      $elem.on('plotselected', (_event, ranges) => {
        $scope.$evalAsync(() => {
          timefilter.time.from = moment(ranges.xaxis.from);
          timefilter.time.to = moment(ranges.xaxis.to);
          timefilter.time.mode = 'absolute';
        });
      });

      $elem.on('mouseleave', () => {
        $rootScope.$broadcast('monitoringPlotLeave');
      });

      $scope.$on('monitoringPlotHover', (_angularEvent, _flotEvent, pos, _time) => {
        $scope.plot.setCrosshair(pos);
        debouncedSetLegendNumbers(pos);
      });

      $scope.$on('monitoringPlotLeave', (_angularEvent, _flotEvent, _pos, _time) => {
        $scope.plot.clearCrosshair();
        clearLegendNumbers();
      });

      const debounceDelay = 50;
      debouncedSetLegendNumbers = _.debounce(setLegendNumbers, debounceDelay, {
        maxWait: debounceDelay,
        leading: true,
        trailing: false
      });

      // Shamelessly borrowed from the flotCrosshairs example
      function setLegendNumbers(pos) {
        const plot = $scope.plot;

        const axes = plot.getAxes();
        if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max) {
          return;
        }

        let i;
        let j;
        const dataset = plot.getData();
        for (i = 0; i < dataset.length; ++i) {

          const series = dataset[i];
          const format = _.get(series, '_meta.metric.format', '0,0.0');
          const units = _.get(series, '_meta.metric.units', '');

          if (series._hide) continue;

          // Nearest point
          for (j = 0; j < series.data.length; ++j) {
            if (series.data[j] && series.data[j][0] > pos.x) {
              break;
            }
          }

          let y;
          try {
            y = series.data[j][1];
          } catch (e) {
            y = null;
          }

          if (y != null) {
            let formatted = ': ' + numeral(y).format(format);
            if (units !== 'B' && units !== '') {
              formatted += ' ' + units;
            }
            legendValueNumbers.eq(i).text(formatted);
          } else {
            legendValueNumbers.eq(i).empty();
          }
        }
      }

      function clearLegendNumbers() {
        _.each(legendValueNumbers, (num) =>  $(num).empty());
      }

      function createChartData(chartSeries, index) {
        if (!chartSeries) {
          $elem.empty();
          return;
        }

        // use the seed colors for any color after the first
        const seriesColor = (index === 0 ? appColors[chartSeries.metric.app] : getColors(index)[index - 1]);
        const series = {
          color: seriesColor,
          data: chartSeries.data.map((row) => {
            if (row) {
              return [row.x, row.y];
            }
            return row;
          }),
          label: chartSeries.metric.label,
          lines: {
            lineWidth: 2
          },
          shadowSize: 0,
          _id: index,
          _meta: { metric: chartSeries.metric }
        };

        return series;
      }

      let $legendScope = null;

      $scope.$watch('series', series => {
        const options = _.cloneDeep(defaultOptions);
        const data = series.map((s, index) => createChartData(s, index)); // chart data for each series

        const dataSize = series.reduce((prev, current) => {
          return prev + current.data.length;
        }, 0);
        if (dataSize !== 0) {
          const bounds = timefilter.getBounds();
          options.xaxis.min = bounds.min.valueOf();
          options.xaxis.max = bounds.max.valueOf();
        }

        options.yaxis = {
          tickFormatter: (number) => {
            return numeral(number)
            .format(_.chain(series)
            .pluck('metric.format')
            .last()
            .value());
          }
        };

        $scope.plot = $.plot($elem, data, options);

        if ($legendScope) {
          $legendScope.$destroy();
        }

        $legendScope = $scope.$new();
        // Used to toggle the series, and for displaying values on hover
        legendValueNumbers = $elem.find('.ngLegendValueNumber');
        _.each($elem.find('.ngLegendValue'), (elem) => {
          $compile(elem)($legendScope);
        });
      });
    }
  };
});
