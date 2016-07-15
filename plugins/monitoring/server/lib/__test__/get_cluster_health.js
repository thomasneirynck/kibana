import { handleResponse } from '../get_clusters_health';
import sinon from 'sinon';
import expect from 'expect.js';
import moment from 'moment';
import { set } from 'lodash';

const config = {
  get: sinon.stub().withArgs('xpack.monitoring.node_resolver').returns('name')
};
const clusters = [
  {
    cluster_uuid: 'abc123',
    state_timestamp: moment().format()
  }
];
const clusterTimestamp = moment().format();
const response = {};
set(response, 'responses[0].hits.total', 1);
set(response, 'responses[0].hits.hits[0]._source.cluster_uuid', 'abc123');
set(response, 'responses[0].hits.hits[0]._source.cluster_state.status', 'green');
set(response, 'responses[0].hits.hits[0]._source.cluster_state.state_uuid', 'uuid1123');
set(response, 'responses[0].hits.hits[0]._source.timestamp', clusterTimestamp);
set(response, 'responses[0].hits.hits[0]._source.cluster_state.nodes', {
  nodeUuid0123: {
    name: 'node01',
    uuid: 'nodeUuid0123'
  }
});

describe('get_clusters_health', () => {
  it('returns an available cluster', () => {
    const result = handleResponse(config, clusters)(response);
    expect(result.length).to.be(1);
    expect(result[0].cluster_uuid).to.be('abc123');
    expect(result[0].status).to.be('green');
    expect(result[0].state_uuid).to.be('uuid1123');
    expect(result[0].state_timestamp).to.be(clusterTimestamp);
    expect(result[0].nodes).to.be.eql({
      node01: {
        name: 'node01',
        uuid: 'nodeUuid0123'
      }
    });
  });

  it('filters out an unavailable cluster', () => {
    set(response, 'responses[0].hits.hits[0]._source.timestamp', moment().subtract(11, 'minutes').format());
    const result = handleResponse(config, clusters)(response);
    expect(result.length).to.be(0);
  });
});
