import React, { Component } from 'react';
import Histogram from '../../../shared/charts/Histogram';

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

function loadErrorDistribution(props) {
  const { appName, start, end, errorGroupId } = props.urlParams;

  if (appName && start && end && errorGroupId && !props.distribution.status) {
    props.loadErrorDistribution({ appName, start, end, errorGroupId });
  }
}

class Distribution extends Component {
  componentDidMount() {
    loadErrorDistribution(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadErrorDistribution(nextProps);
  }

  render() {
    const { distribution } = this.props;
    const buckets = getFormattedBuckets(
      distribution.data.buckets,
      distribution.data.bucketSize
    );
    return (
      <div>
        <Histogram
          xType="time"
          formatYValue={value => `${value} err.`}
          buckets={buckets}
          bucketSize={distribution.data.bucketSize}
        />
      </div>
    );
  }
}

export default Distribution;
