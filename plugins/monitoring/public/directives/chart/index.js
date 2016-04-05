const _ = require('lodash');
const numeral = require('numeral');
const $ = require('jquery');
const moment = require('moment');
require('flot-charts/jquery.flot');
require('flot-charts/jquery.flot.time');
require('flot-charts/jquery.flot.canvas');
require('flot-charts/jquery.flot.symbol');
require('flot-charts/jquery.flot.crosshair');
require('flot-charts/jquery.flot.selection');
const app = require('ui/modules').get('plugins/monitoring/directives', []);

app.directive('monitoringChart', () => {
  return {
    restrict: 'E',
    template: require('plugins/monitoring/directives/chart/index.html'),
    scope: {
      series: '='
    },
    link($scope) {
      $scope.$watch('series', series => {
        $scope.metrics = series.map(s => {
          const last = _.last(s.data);
          return {
            label: s.metric.label,
            units: s.metric.units,
            value: numeral(last && last.y || 0).format(s.metric.format)
          };
        });
      });
    }
  };
});

app.directive('chart', ($compile, $rootScope, timefilter, $timeout) => {
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
          labelBoxBorderColor: 'rgb(255,255,255,0)',
          labelFormatter: (label, _series) => {
            return '<span class="ngLegendValue">' +
              label +
              '<span class="ngLegendValueNumber"></span></span>';
          }
        },
        yaxes: [ {}, { position: 'right' } ],
        colors: ['#01A4A4', '#C66', '#D0D102', '#616161', '#00A1CB', '#32742C', '#F18D05', '#113F8C', '#61AE24', '#D70060']
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
            legendValueNumbers.eq(i).text(': ' + numeral(y).format(format) + ' ' + units);
          } else {
            legendValueNumbers.eq(i).empty();
          }
        }
      }

      function clearLegendNumbers() {
        _.each(legendValueNumbers, (num) =>  $(num).empty());
      }

      const colorCodesForIndex = [
        '#000', // black
        '#105a73', // dark blue (link hover/focus color)
      ];

      function createChartData(chartSeries, idx) {
        if (!chartSeries) {
          $elem.empty();
          return;
        }

        const series = {
          shadowSize: 0,
          lines: {
            lineWidth: 2
          },
          _meta: { metric: chartSeries.metric }
        };
        series._id = 0;
        series.data = chartSeries.data.map((row) => {
          if (row) {
            return [row.x, row.y];
          }
          return row;
        });
        series.color = colorCodesForIndex[idx];
        series.label = chartSeries.metric.label;

        return series;
      }

      $scope.$watch('series', series => {
        const options = _.cloneDeep(defaultOptions);
        const data = series.map((s, idx) => createChartData(s, idx)); // chart data for each series

        const dataSize = series.reduce((prev, current) => {
          return prev + current.data.length;
        }, 0);
        if (!dataSize === 0) {
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

        let legendScope = $scope.$new();
        legendScope.$destroy();
        legendScope = $scope.$new();
        // Used to toggle the series, and for displaying values on hover
        legendValueNumbers = $elem.find('.ngLegendValueNumber');
        _.each($elem.find('.ngLegendValue'), (elem) => {
          $compile(elem)(legendScope);
        });
      });
    }
  };
});
