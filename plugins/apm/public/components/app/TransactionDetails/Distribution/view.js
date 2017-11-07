import React, { Component } from 'react';
import d3 from 'd3';
import Histogram from '../../../shared/charts/Histogram';
import { toQuery, fromQuery } from '../../../../utils/url';
import { withRouter } from 'react-router-dom';
import EmptyMessage from '../../../shared/EmptyMessage';
import { getTimeFormatter, asRpm, getUnit } from '../../../../utils/formatters';

export function getFormattedBuckets(buckets, bucketSize) {
  if (!buckets) {
    return null;
  }

  const yMax = Math.max(...buckets.map(item => item.count));
  const yMin = yMax * 0.1;

  return buckets.map(({ count, key, transactionId }) => {
    return {
      transactionId,
      x0: key,
      x: key + bucketSize,
      y: count > 0 ? Math.max(count, yMin) : 0
    };
  });
}

function loadTransactionDistribution(props) {
  const { appName, start, end, transactionName } = props.urlParams;

  if (
    appName &&
    start &&
    end &&
    transactionName &&
    !props.distribution.status
  ) {
    props.loadTransactionDistribution({ appName, start, end, transactionName });
  }
}

class Distribution extends Component {
  componentDidMount() {
    loadTransactionDistribution(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadTransactionDistribution(nextProps);
  }

  render() {
    const { history, location, distribution } = this.props;
    const buckets = getFormattedBuckets(
      distribution.data.buckets,
      distribution.data.bucketSize
    );

    const isEmpty = distribution.data.totalHits === 0;
    const xMax = d3.max(buckets, d => d.x);
    const timeFormatter = getTimeFormatter(xMax);
    const unit = getUnit(xMax);

    if (isEmpty) {
      return (
        <EmptyMessage heading="No transactions in the selected time range." />
      );
    }

    return (
      <div>
        <Histogram
          buckets={buckets}
          bucketSize={distribution.data.bucketSize}
          transactionId={this.props.urlParams.transactionId}
          onClick={bucket => {
            history.replace({
              ...location,
              search: fromQuery({
                ...toQuery(location.search),
                transactionId: bucket.transactionId
              })
            });
          }}
          formatXValue={timeFormatter}
          formatYValue={asRpm}
          formatTooltipHeader={(hoveredX0, hoveredX) =>
            `${timeFormatter(hoveredX0, false)} - ${timeFormatter(
              hoveredX,
              false
            )} ${unit}`}
          tooltipLegendTitle="Requests"
        />
      </div>
    );
  }
}

export default withRouter(Distribution);
