import React, { Component } from 'react';
import Histogram from '../../../shared/charts/Histogram';
import { toQuery, fromQuery } from '../../../../utils/url';
import { withRouter } from 'react-router-dom';

export function getFormattedBuckets(buckets, bucketSize) {
  if (!buckets) {
    return null;
  }

  const yMax = Math.max(...buckets.map(item => item.count));
  const yMin = yMax * 0.1;

  return buckets.map(({ count, key }, i) => {
    return {
      i,
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
    return (
      <div>
        <Histogram
          formatYValue={value => `${value} reqs.`}
          buckets={buckets}
          bucketSize={distribution.data.bucketSize}
          selectedBucket={this.props.urlParams.bucket}
          onClick={bucket => {
            history.replace({
              ...location,
              search: fromQuery({
                ...toQuery(location.search),
                bucket
              })
            });
          }}
        />
      </div>
    );
  }
}

export default withRouter(Distribution);
