import React, { Component } from 'react';
import Histogram from '../../../shared/charts/Histogram';
import EmptyMessage from '../../../shared/EmptyMessage';
import { GraphHeader } from '../../../shared/UIComponents';
import { getKey } from '../../../../store/apiHelpers';

export function getFormattedBuckets(buckets, bucketSize) {
  if (!buckets) {
    return null;
  }

  return buckets.map(({ count, key }) => {
    return {
      x0: key,
      x: key + bucketSize,
      y: count
    };
  });
}

function maybeLoadErrorDistribution(props) {
  const { serviceName, start, end, errorGroupId } = props.urlParams;
  const keyArgs = { serviceName, start, end, errorGroupId };
  const key = getKey(keyArgs);

  //TODO what about load status? `props.distribution.status`
  if (key && props.distribution.key !== key) {
    props.loadErrorDistribution(keyArgs);
  }
}

class Distribution extends Component {
  componentDidMount() {
    maybeLoadErrorDistribution(this.props);
  }

  componentWillReceiveProps(nextProps) {
    maybeLoadErrorDistribution(nextProps);
  }

  render() {
    const { distribution } = this.props;
    const buckets = getFormattedBuckets(
      distribution.data.buckets,
      distribution.data.bucketSize
    );

    const isEmpty = distribution.data.totalHits === 0;

    if (isEmpty) {
      return <EmptyMessage heading="No errors in the selected time range." />;
    }

    return (
      <div>
        <GraphHeader>Occurrences</GraphHeader>
        <Histogram
          verticalLineHover={bucket => bucket.x}
          xType="time"
          buckets={buckets}
          bucketSize={distribution.data.bucketSize}
          formatYShort={value => `${value} occ.`}
          formatYLong={value => `${value} occurrences`}
        />
      </div>
    );
  }
}

export default Distribution;
