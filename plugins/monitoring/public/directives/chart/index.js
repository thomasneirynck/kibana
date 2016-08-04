import _ from 'lodash';
import numeral from 'numeral';
import $ from 'jquery';
import moment from 'moment';
import VislibComponentsColorColorPaletteProvider from 'ui/vislib/components/color/color_palette';
import uiModules from 'ui/modules';
import template from 'plugins/monitoring/directives/chart/index.html';
import descriptionTemplate from './description_template.html';
import { setLegendByX, setLegendForSeriesIndex } from './chart_helpers';
import 'flot-charts/jquery.flot';
import 'flot-charts/jquery.flot.time';
import 'flot-charts/jquery.flot.canvas';
import 'flot-charts/jquery.flot.symbol';
import 'flot-charts/jquery.flot.crosshair';
import 'flot-charts/jquery.flot.selection';
import 'ui/tooltip';

const appColors = Object.freeze({
  elasticsearch: '#3ebeb0',
  kibana: '#e8488b'
});

function get(series, attr) {
  return _.chain(series).pluck(attr).last().value();
}

/**
 * Format the {@code value} based on the current {@code series}.
 *
 * @param series {Object} The series from the plot (chart).
 * @param value {number} The value of a current highlighted point.
 * @returns {String} Formatted {@code value}.
 */
function formatValue(series, value) {
  const format = _.get(series, '_meta.metric.format', '0,0.0');
  const units = _.get(series, '_meta.metric.units', '');

  let formatted = numeral(value).format(format);

  // numeral writes 'B' as the actual size (e.g., 'MB')
  if (units !== 'B' && units !== '') {
    formatted += ' ' + units;
  }

  return formatted;
}

const uiModule = uiModules.get('plugins/monitoring/directives', []);
uiModule.directive('monitoringChart', ($compile) => {
  return {
    restrict: 'E',
    template,
    scope: {
      series: '='
    },
    link($scope) {
      const compiledDescription = $compile(descriptionTemplate);

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

        const descriptions = _.assign($scope.$new(true), (() => {
          return {
            descriptions: series.map((chartData) => {
              return {
                label: _.escape(_.get(chartData, 'metric.label')),
                description: _.escape(_.get(chartData, 'metric.description'))
              };
            })
          };
        }()));
        const descriptionEl = compiledDescription(descriptions);
        $scope.$evalAsync(() => {
          $scope.description = descriptionEl.prop('outerHTML');
        });
      });
    }
  };
});

uiModule.directive('chart', ($compile, $rootScope, timefilter, $timeout, Private) => {
  const getColors = Private(VislibComponentsColorColorPaletteProvider);

  return {
    restrict: 'E',
    scope: {
      series: '='
    },
    link: ($scope, $elem) => {
      let legendValueNumbers;
      const debounceDelay = 50;
      const debouncedSetLegendByX = _.debounce(setLegendByX, debounceDelay, {
        maxWait: debounceDelay,
        leading: true,
        trailing: false
      });
      const debouncedSetLegendByIndex = _.debounce(setLegendForSeriesIndex, debounceDelay, {
        maxWait: debounceDelay,
        leading: true,
        trailing: false
      });
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
        lines: {
          show: true,
          lineWidth: 2
        },
        points: {
          show: true,
          radius: 1
        },
        shadowSize: 0,
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
          autoHighlight: true
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

      $scope.$on('monitoringPlotHover', (_angularEvent, _flotEvent, pos, item) => {
        $scope.plot.setCrosshair(pos);

        const legend = (series, index, value) => {
          const seriesLegend = legendValueNumbers.eq(index);

          if (_.isNumber(value)) {
            seriesLegend.text(': ' + formatValue(series, value));
          } else {
            seriesLegend.empty();
          }
        };

        if (item) {
          debouncedSetLegendByIndex(legend, $scope.plot, item.dataIndex);
        } else {
          debouncedSetLegendByX(legend, $scope.plot, pos.x);
        }
      });

      $scope.$on('monitoringPlotLeave', (_angularEvent, _flotEvent, _pos, _item) => {
        $scope.plot.clearCrosshair();
        clearLegendNumbers();
      });

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
