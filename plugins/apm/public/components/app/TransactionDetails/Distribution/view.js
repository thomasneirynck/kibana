import React, { Component } from 'react';
import d3 from 'd3';
import Histogram from '../../../shared/charts/Histogram';
import { toQuery, fromQuery } from '../../../../utils/url';
import { withRouter } from 'react-router-dom';
import EmptyMessage from '../../../shared/EmptyMessage';
import { getTimeFormatter, timeUnit } from '../../../../utils/formatters';

export function getFormattedBuckets(buckets, bucketSize) {
  if (!buckets) {
    return null;
  }

  return buckets.map(({ count, key, transactionId }) => {
    return {
      transactionId,
      x0: key,
      x: key + bucketSize,
      y: count
    };
  });
}

function loadTransactionDistribution(props) {
  const { serviceName, start, end, transactionName } = props.urlParams;

  if (
    serviceName &&
    start &&
    end &&
    transactionName &&
    !props.distribution.status
  ) {
    props.loadTransactionDistribution({
      serviceName,
      start,
      end,
      transactionName
    });
  }
}

class Distribution extends Component {
  componentDidMount() {
    loadTransactionDistribution(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadTransactionDistribution(nextProps);
  }

  formatYValue = t => {
    return `${t} ${distributionUnit(this.props.urlParams.transactionType)}`;
  };

  render() {
    const { history, location, distribution } = this.props;
    const buckets = getFormattedBuckets(
      distribution.data.buckets,
      distribution.data.bucketSize
    );

    const isEmpty = distribution.data.totalHits === 0;
    const xMax = d3.max(buckets, d => d.x);
    const timeFormatter = getTimeFormatter(xMax);
    const unit = timeUnit(xMax);

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
          formatYValue={this.formatYValue}
          formatTooltipHeader={(hoveredX0, hoveredX) =>
            `${timeFormatter(hoveredX0, false)} - ${timeFormatter(
              hoveredX,
              false
            )} ${unit}`
          }
          tooltipLegendTitle={transactionLabel(
            this.props.urlParams.transactionType
          )}
        />
      </div>
    );
  }
}

function distributionUnit(type) {
  return type === 'request' ? 'req.' : 'trans.';
}

function transactionLabel(type) {
  return type === 'request' ? 'Requests' : 'Transactions';
}

export default withRouter(Distribution);
