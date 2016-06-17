import { get } from 'lodash';
import React from 'react';
import numeral from 'numeral';
import OfflineCell from './OfflineCell';
export default class MetricCell extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    function formatMetric(metric, key) {
      const meta = metric.metric;
      const value = get(metric, key);
      if (!meta.format) { return value; }
      return numeral(value).format(meta.format) + meta.units;
    }

    function slopeArrow(metric) {
      if (metric.slope > 0) {
        return 'up';
      }
      return 'down';
    }

    if (this.props.isOnline) {
      return (
        <td key={this.props.metric}>
          <div className='big inline'>
            {formatMetric(this.props.metric, 'last')}
          </div>
          <i className={`big inline fa fa-long-arrow-${slopeArrow(this.props.metric)}`}/>
          <div className='inline'>
            <div className='small'>
              {formatMetric(this.props.metric, 'max')} max
            </div>
            <div className='small'>
              {formatMetric(this.props.metric, 'min')} min
            </div>
          </div>
        </td>
      );
    }

    return <OfflineCell/>;

  }
};
