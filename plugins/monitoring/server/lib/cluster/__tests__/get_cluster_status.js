import expect from 'expect.js';
import { getClusterStatus } from '../get_cluster_status';

describe('getClusterStatus', () => {
  it('gets an unknown status', () => {
    const defaultResult = getClusterStatus({});

    expect(defaultResult).to.eql({
      status: 'unknown',
      nodesCount: 0,
      indicesCount: 0,
      totalShards: 0,
      unassignedShards: 0,
      documentCount: 0,
      dataSize: 0,
      upTime: 0,
      version: null,
      memUsed: 0,
      memMax: 0
    });
  });

  it('calculates totalShards using just clusterStatus', () => {
    const clusterStats = {
      cluster_stats: {
        indices: {
          count: 10,
          docs: {
            count: 250
          },
          shards: {
            total: 40
          },
          store: {
            size_in_bytes: 250000000
          }
        },
        nodes: {
          count: {
            total: 2
          },
          jvm: {
            mem: {
              heap_used_in_bytes: 500000,
              heap_max_in_bytes: 800000
            },
            max_uptime_in_millis: 60000000
          },
          versions: [ '1.1.1' ]
        }
      },
      cluster_state: {
        status: 'green'
      }
    };

    const greenResult = getClusterStatus(clusterStats);

    expect(greenResult).to.eql({
      status: 'green',
      nodesCount: 2,
      indicesCount: 10,
      totalShards: 40,
      unassignedShards: 0,
      documentCount: 250,
      dataSize: 250000000,
      upTime: 60000000,
      version: [ '1.1.1' ],
      memUsed: 500000,
      memMax: 800000
    });
  });

  it('calculates totalShards and unassignedShards using clusterStatus and shardStats.indices.totals', () => {
    const clusterStats = {
      cluster_stats: {
        indices: {
          count: 10,
          docs: {
            count: 250
          },
          shards: {
            total: 40
          },
          store: {
            size_in_bytes: 250000000
          }
        },
        nodes: {
          count: {
            total: 2
          },
          jvm: {
            mem: {
              heap_used_in_bytes: 500000,
              heap_max_in_bytes: 800000
            },
            max_uptime_in_millis: 60000000
          },
          versions: [ '1.1.1' ]
        }
      },
      cluster_state: {
        status: 'green'
      }
    };
    const shardStatsIndicesTotalsUnassigned = {
      replica: 7,
      primary: 3
    };

    const calculatedResult = getClusterStatus(clusterStats, shardStatsIndicesTotalsUnassigned);

    expect(calculatedResult).to.eql({
      status: 'green',
      nodesCount: 2,
      indicesCount: 10,
      totalShards: 50, // 40 from clusterStats, 10 from unassignedShards
      unassignedShards: 10, // all from unassignedShards
      documentCount: 250,
      dataSize: 250000000,
      upTime: 60000000,
      version: [ '1.1.1' ],
      memUsed: 500000,
      memMax: 800000
    });
  });
});
