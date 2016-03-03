import _ from 'lodash';

export default function mapResponseTimes(times) {
  const responseTimes = _.reduce(_.values(times), (result, value) => {
    if (value.avg) {
      result.avg += value.avg;
    }
    result.max = Math.max(result.max, value.max);
    return result;
  }, {avg: null, max: 0});
  return {
    average: responseTimes.avg === null ? null : responseTimes.avg / Math.max(_.size(times), 1),
    max: responseTimes.max
  };
}
