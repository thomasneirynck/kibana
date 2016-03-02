import createQuery from '../create_query.js';
import expect from 'expect.js';
import _ from 'lodash';

describe('Create Query', () => {
  it('Injects cluster_uuid', () => {
    const options = { clusterUuid: 'abc123' };
    const result = createQuery(options);
    const expected = _.set({}, 'bool.filter.bool.must[0].term.cluster_uuid', 'abc123');
    expect(result).to.be.eql(expected);
  });
  it('Uses start and end time range', () => {
    const options = { clusterUuid: 'abc123', start: '2016-03-01 10:00:00', end: '2016-03-01 10:00:01' };
    const result = createQuery(options);
    let expected = {};
    expected = _.set(expected, 'bool.filter.bool.must[0].term.cluster_uuid', 'abc123');
    expected = _.set(expected, 'bool.filter.bool.must[1].range.timestamp', {
      format: 'epoch_millis',
      gte: 1456826400000,
      lte: 1456826401000
    });
    expect(result).to.be.eql(expected);
  });
});
