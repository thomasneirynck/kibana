import React from 'react';
import { includes, isFunction } from 'lodash';

export default class HorizontalLegend extends React.Component {
  constructor() {
    super();
    this.formatter = this.formatter.bind(this);
    this.createSeries = this.createSeries.bind(this);
  }

  formatter(value) {
    if (isFunction(this.props.tickFormatter)) {
      return this.props.tickFormatter(value);
    }
    return value;
  }

  createSeries(row) {
    const formatter = row.tickFormatter || this.formatter;
    const value = formatter(this.props.seriesValues[row.id]);
    const classes = ['rhythm_chart__legend_item'];
    const key = row.id;

    if (!includes(this.props.seriesFilter, row.id)) {
      classes.push('disabled');
    }
    if (!row.label || row.legend === false) {
      return (
        <div key={key} style={{display: 'none'}}/>
      );
    }

    return (
      <div
        className={classes.join(' ')}
        onClick={event => this.props.onToggle(event, row.id)}
        key={key}
      >
        <div className='rhythm_chart__legend_label'>
          <span className='fa fa-circle' style={{color: row.color}}/>
          <span>{row.label}</span>
        </div>
        <div className='rhythm_chart__legend_value'>{value}</div>
      </div>
    );
  }

  render() {
    const rows = this.props.series.map(this.createSeries);

    return (
      <div className='rhythm_chart__legend-horizontal'>
        <div className='rhythm_chart__legend-control'>
          <span>&nbsp;</span>
        </div>
        <div className='rhythm_chart__legend-series'>
          {rows}
        </div>
      </div>
    );
  }
}
