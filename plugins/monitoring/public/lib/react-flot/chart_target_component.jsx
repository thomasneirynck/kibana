import _ from 'lodash';
import React from 'react';
import $ from 'jquery-flot'; // webpackShim
import eventBus from './event_bus';
import getChartOptions from './get_chart_options';

const RESIZE_TIMEOUT = 250; // resize handler to execute at a rate of 4fps

export default class ChartTarget extends React.Component {
  shouldComponentUpdate() {
    return !this.plot;
  }

  shutdownChart() {
    if (!this.plot) return;
    const { target } = this.refs;
    $(target).unbind('plothover', this.props.plothover);
    $(target).on('plothover', this.handleMouseOver);
    $(target).on('mouseleave', this.handleMouseLeave);
    $(target).off('plotselected', this.brushChart);

    this.plot.shutdown();

    $(target).off('plothover', this.handlePlothover);
    eventBus.off('thorPlothover', this.handleThorPlothover);
    eventBus.off('thorPlotleave', this.handleThorPlotleave);
    eventBus.off('thorPlotselecting', this.handleThorPlotselecting);
    eventBus.off('thorPlotbrush', this.handleThorPlotbrush);
  }

  componentWillUnmount() {
    this.shutdownChart();
    window.removeEventListener('resize', this.resizeThrottler);
  }

  filterByShow(seriesToShow) {
    if (seriesToShow) {
      return (metric) => {
        return seriesToShow.some(id => _.startsWith(id, metric.id));
      };
    }
    return (_metric) => true;
  }

  componentWillReceiveProps(newProps) {
    if (this.plot) {
      const { series } = newProps;
      this.plot.setData(this.filterData(series, newProps.seriesToShow));
      this.plot.setupGrid();
      this.plot.draw();
    }
  }

  componentDidMount() {
    this.renderChart();
    window.addEventListener('resize', this.resizeThrottler, false);

    // resizes legend container after each series is initialized
    this.resizeThrottler();
  }

  componentDidUpdate() {
    this.shutdownChart();
    this.renderChart();
  }

  filterData(data, seriesToShow) {
    return _(data)
    .filter(this.filterByShow(seriesToShow))
    .value();
  }

  getOptions() {
    const opts = getChartOptions({
      tickFormatter: this.props.tickFormatter
    });

    return _.assign(opts, this.props.options);
  }

  renderChart() {
    const { target} = this.refs;
    const { series } = this.props;
    const data = this.filterData(series, this.props.seriesToShow);

    this.plot = $.plot(target, data, this.getOptions());

    this._handleResize = () => {
      if (!this.plot) return;
      try {
        this.plot.resize();
        this.plot.setupGrid();
        this.plot.draw();
      }
      catch (e) { // eslint-disable-line no-empty
        /* It is ok to silently swallow the error here. Resize events fire
         * continously so the proper resize will happen in a later firing of
         * the event */
      }
    };

    // simulate the "end" of the resize action
    // needs setTimeout/clearTimeout since resize events are continous
    // http://stackoverflow.com/a/5490021
    let resizeTimeout;
    this.resizeThrottler = () => {
      resizeTimeout = window.setTimeout(() => {
        clearTimeout(resizeTimeout);
        this._handleResize(); // actual resize handler
      }, RESIZE_TIMEOUT);
    };

    this.handleMouseOver = (...args) => {
      this.props.onMouseOver(...args, this.plot);
    };

    this.handleMouseLeave = () => {
      eventBus.trigger('thorPlotleave', []);
    };

    $(target).on('plothover', this.handleMouseOver);
    $(target).on('mouseleave', this.handleMouseLeave);

    this.handlePlothover = (_event, pos, item) => {
      eventBus.trigger('thorPlothover', [pos, item, this.plot]);
    };

    $(target).on('plothover', this.handlePlothover);
    $(target).bind('plothover', this.props.plothover);

    this.handleThorPlothover = (_event, pos, item, originalPlot) => {
      if (this.plot !== originalPlot) {
        this.plot.setCrosshair({ x: _.get(pos, 'x')});
        this.props.updateLegend(pos, item);
      }
    };

    this.handleThorPlotleave = () => {
      this.props.updateLegend(); // gets last values
      this.plot.clearCrosshair();
    };

    this.handleThorPlotselecting = (_event, xaxis, originalPlot) => {
      if (this.plot !== originalPlot) {
        const preventEvent = true;
        this.plot.setSelection({ xaxis }, preventEvent);
      }
    };

    this.handleThorPlotbrush = () => {
      this.plot.clearSelection();
    };

    eventBus.on('thorPlothover', this.handleThorPlothover);
    eventBus.on('thorPlotleave', this.handleThorPlotleave);
    eventBus.on('thorPlotselecting', this.handleThorPlotselecting);
    eventBus.on('thorPlotbrush', this.handleThorPlotbrush);

    this.selectingChart = (_event, ranges) => {
      if (ranges) {
        const xaxis = ranges.xaxis;
        eventBus.trigger('thorPlotselecting', [xaxis, this.plot]);
      }
    };

    this.brushChart = (_event, ranges) => {
      this.props.onBrush(ranges);
      eventBus.trigger('thorPlotbrush');
    };

    $(target).on('plotselecting', this.selectingChart);
    $(target).on('plotselected', this.brushChart);
  }

  render() {
    const style = {
      position: 'relative',
      display: 'flex',
      rowDirection: 'column',
      flex: '1 0 auto'
    };

    return (
      <div ref="target" style={style} />
    );
  }
}
