import { set } from 'lodash';
import expect from 'expect.js';
import { handleResponse } from '../get_cluster_status';

function getLastState(status) {
  return {
    cluster_state: {
      status
    }
  };
}

describe('get_cluster_status', () => {
  it('unknown status', () => {
    const lastState = getLastState();
    const resp = {
      hits: {
        total: 0,
        hits: []
      }
    };
    const defaultResult = handleResponse(lastState)(resp);

    expect(defaultResult).to.eql({
      status: 'unknown',
      nodesCount: 0,
      indicesCount: 0,
      totalShards: 0,
      documentCount: 0,
      dataSize: 0,
      upTime: 0,
      version: null,
      memUsed: 0,
      memMax: 0
    });
  });

  it('green status', () => {
    const lastState = getLastState('green');
    const resp = {
      hits: {
        total: 1,
        hits: []
      }
    };
    set(resp, 'hits.hits[0]._source.cluster_stats.nodes.count.total', 2);
    set(resp, 'hits.hits[0]._source.cluster_stats.indices.count', 10);
    set(resp, 'hits.hits[0]._source.cluster_stats.indices.shards.total', 40);
    set(resp, 'hits.hits[0]._source.cluster_stats.indices.docs.count', 250);
    set(resp, 'hits.hits[0]._source.cluster_stats.indices.store.size_in_bytes', 250000000);
    set(resp, 'hits.hits[0]._source.cluster_stats.nodes.jvm.max_uptime_in_millis', 60000000);
    set(resp, 'hits.hits[0]._source.cluster_stats.nodes.versions', '1.1.1');
    set(resp, 'hits.hits[0]._source.cluster_stats.nodes.jvm.mem.heap_used_in_bytes', 500000);
    set(resp, 'hits.hits[0]._source.cluster_stats.nodes.jvm.mem.heap_max_in_bytes', 800000);
    const defaultResult = handleResponse(lastState)(resp);

    expect(defaultResult).to.eql({
      status: 'green',
      nodesCount: 2,
      indicesCount: 10,
      totalShards: 40,
      documentCount: 250,
      dataSize: 250000000,
      upTime: 60000000,
      version: '1.1.1',
      memUsed: 500000,
      memMax: 800000
    });
  });
});
