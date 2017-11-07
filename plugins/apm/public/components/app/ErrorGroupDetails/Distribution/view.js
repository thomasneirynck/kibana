import React, { Component } from 'react';
import Histogram from '../../../shared/charts/Histogram';
import EmptyMessage from '../../../shared/EmptyMessage';

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

    const isEmpty = distribution.data.totalHits === 0;

    if (isEmpty) {
      return <EmptyMessage heading="No errors in the selected time range." />;
    }

    return (
      <div>
        <Histogram
          xType="time"
          buckets={buckets}
          bucketSize={distribution.data.bucketSize}
          formatYValue={value => `${value} err.`}
          tooltipLegendTitle="Occurences"
        />
      </div>
    );
  }
}

export default Distribution;
