import d3 from 'd3';
import $ from 'jquery';
import { VislibVisualizationsChartProvider } from './_chart';
import { GaugeTypesProvider } from './gauges/gauge_types';

export function GaugeChartProvider(Private) {

  const Chart = Private(VislibVisualizationsChartProvider);
  const gaugeTypes = Private(GaugeTypesProvider);

  class GaugeChart extends Chart {
    constructor(handler, chartEl, chartData) {
      super(handler, chartEl, chartData);
      this.gaugeConfig = handler.visConfig.get('gauge', {});
      this.gauge = new gaugeTypes[this.gaugeConfig.type](this);
    }

    addEvents(element) {
      const events = this.events;

      return element
        .call(events.addHoverEvent())
        .call(events.addMouseoutEvent())
        .call(events.addClickEvent());
    }


    _drawOldSkool() {
      const self = this;
      const verticalSplit = this.gaugeConfig.verticalSplit;

      return function (selection) {
        selection.each(function (data) {
          const div = d3.select(this);
          const containerMargin = 5;
          const containerWidth = $(this).width() - containerMargin;
          const containerHeight = $(this).height() - containerMargin;
          const width = Math.floor(verticalSplit ? $(this).width() : containerWidth / data.series.length);
          const height = Math.floor((verticalSplit ? containerHeight / data.series.length : $(this).height()) - 25);
          const transformX = width / 2;
          const transformY = self.gaugeConfig.gaugeType === 'Meter' ? height / 1.5 : height / 2;


          data.series.forEach(series => {
            const svg = div.append('svg')
              .attr('width', width)
              .attr('height', height)
              .style('display', 'inline-block')
              .style('overflow', 'hidden');

            const g = svg.append('g')
              .attr('transform', `translate(${transformX}, ${transformY})`);

            const gauges = self.gauge.drawGauge(g, series, width, height);
            self.addEvents(gauges);
          });

          div.append('div')
            .attr('class', 'chart-title')
            .style('text-align', 'center')
            .text(data.label || data.yAxisLabel);

          self.events.emit('rendered', {
            chart: data
          });

          return div;
        });
      };
    }

    _drawNewSkool() {

      const self = this;
      const verticalSplit = this.gaugeConfig.verticalSplit;

      const allGaugesContainer = document.createElement('div');
      allGaugesContainer.classList.add('gauges-container');
      self.chartEl.appendChild(allGaugesContainer);

      //todo: based on vertical split, change vertical or horizontal flexbox

      return function (selection) {

        //silly d3. we'll only have a single selection
        let firstData;
        let containerMargin = 5;
        let allContainerWidth, allContainerHeight;
        selection.each(function (data) {
          firstData = data;
          containerMargin = 5;
          allContainerWidth = $(this).width() - containerMargin;
          allContainerHeight = $(this).height() - containerMargin;
        });

        if (!firstData) {
          return;
        }

        //loop, so we're not creating crufty function on the heap
        // const divContainersForGauge = [];
        for (let i = 0; i < firstData.series.length; i++) {
          const gaugeContainer = document.createElement('div');
          gaugeContainer.setAttribute('data-gauge-id', `gauge-${i}`);
          gaugeContainer.classList.add('gauge-container');
          allGaugesContainer.appendChild(gaugeContainer);

          const dataSeries = firstData.series[i];
          self.gauge.placeGaugeInDiv(gaugeContainer, dataSeries, allContainerWidth, allContainerHeight);
        }


      //   selection.each(function (data) {
      //     const div = d3.select(this);
      //     const containerMargin = 5;
      //     const containerWidth = $(this).width() - containerMargin;
      //     const containerHeight = $(this).height() - containerMargin;
      //     const width = Math.floor(verticalSplit ? $(this).width() : containerWidth / data.series.length);
      //     const height = Math.floor((verticalSplit ? containerHeight / data.series.length : $(this).height()) - 25);
      //     const transformX = width / 2;
      //     const transformY = self.gaugeConfig.gaugeType === 'Meter' ? height / 1.5 : height / 2;
      //
      //
      //     data.series.forEach(series => {
      //       const svg = div.append('svg')
      //         .attr('width', width)
      //         .attr('height', height)
      //         .style('display', 'inline-block')
      //         .style('overflow', 'hidden');
      //
      //       const g = svg.append('g')
      //         .attr('transform', `translate(${transformX}, ${transformY})`);
      //
      //       const gauges = self.gauge.drawGauge(g, series, width, height);
      //       self.addEvents(gauges);
      //     });
      //
      //     div.append('div')
      //       .attr('class', 'chart-title')
      //       .style('text-align', 'center')
      //       .text(data.label || data.yAxisLabel);
      //
      //     self.events.emit('rendered', {
      //       chart: data
      //     });
      //
      //     return div;
      //   });
      };

    }

    draw() {
      if (typeof this.gauge.placeGaugeInDiv === 'function') {
        return this._drawNewSkool();
      } else {
        return this._drawOldSkool();
      }
    }
  }

  return GaugeChart;
}
