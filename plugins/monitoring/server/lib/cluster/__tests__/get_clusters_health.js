import { handleResponse } from '../get_clusters_health';
import expect from 'expect.js';
import moment from 'moment';
import sinon from 'sinon';
import { set } from 'lodash';

const config = {
  get: sinon.stub().withArgs('xpack.monitoring.node_resolver').returns('uuid')
};
const clusters = [
  {
    cluster_uuid: 'abc123'
  }
];
const clusterTimestamp = moment().format();
const response = {
  hits: {
    hits: [
      {
        _source: {
          cluster_uuid: 'abc123',
          timestamp: clusterTimestamp,
          cluster_state: {
            status: 'green',
            state_uuid: 'uuid1123',
            nodes: {
              nodeUuid0123: {
                name: 'node01',
                uuid: 'nodeUuid0123'
              }
            }
          }
        }
      }
    ]
  }
};

describe('get_clusters_health', () => {
  it('returns an available cluster', () => {
    const result = handleResponse(response, config, clusters);
    expect(result).to.be(clusters);
    expect(result.length).to.be(1);
    expect(result[0].cluster_uuid).to.be('abc123');
    expect(result[0].status).to.be('green');
    expect(result[0].state_uuid).to.be('uuid1123');
    expect(result[0].nodes).to.be.eql({
      nodeUuid0123: {
        name: 'node01',
        uuid: 'nodeUuid0123'
      }
    });
  });

  it('does not filter out an unavailable cluster', () => {
    set(response, '.hits.hits[0]._source.timestamp', moment().subtract(30, 'days').format());
    const result = handleResponse(response, config, clusters);
    expect(result).to.be(clusters);
    expect(result.length).to.be(1);
  });
});
