import createQuery from '../create_query.js';
import expect from 'expect.js';
import { set } from 'lodash';

describe('Create Query', () => {
  it('Allows UUID to not be passed', () => {
    const options = {};
    const result = createQuery(options);
    const expected = set({}, 'bool.filter.bool.must', []);
    expect(result).to.be.eql(expected);
  });
  it('Injects cluster_uuid by default', () => {
    const options = { uuid: 'abc123' };
    const result = createQuery(options);
    const expected = set({}, 'bool.filter.bool.must[0].term.cluster_uuid', 'abc123');
    expect(result).to.be.eql(expected);
  });
  it('Uses Elasticsearch timestamp field for start and end time range by default', () => {
    const options = { uuid: 'abc123', start: '2016-03-01 10:00:00', end: '2016-03-01 10:00:01' };
    const result = createQuery(options);
    let expected = {};
    expected = set(expected, 'bool.filter.bool.must[0].term.cluster_uuid', 'abc123');
    expected = set(expected, 'bool.filter.bool.must[1].range.timestamp', {
      format: 'epoch_millis',
      gte: 1456826400000,
      lte: 1456826401000
    });
    expect(result).to.be.eql(expected);
  });
  it('Injects uuid and timestamp fields dynamically, based on metric', () => {
    const options = {
      uuid: 'abc123',
      start: '2016-03-01 10:00:00',
      end: '2016-03-01 10:00:01' ,
      metric: {
        uuidField: 'testUuidField',
        timestampField: 'testTimestampField'
      }
    };
    const result = createQuery(options);
    let expected = set({}, 'bool.filter.bool.must[0].term.testUuidField', 'abc123');
    expected = set(expected, 'bool.filter.bool.must[1].range.testTimestampField', {
      format: 'epoch_millis',
      gte: 1456826400000,
      lte: 1456826401000
    });
    expect(result).to.be.eql(expected);
  });
});
