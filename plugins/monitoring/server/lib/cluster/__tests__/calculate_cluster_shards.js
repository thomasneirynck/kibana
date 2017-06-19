import { calculateClusterShards } from '../calculate_cluster_shards';
import expect from 'expect.js';

describe('Calculating Cluster Status', () => {
  it('Calculates object', () => {
    const body = {
      clusterStatus: {
        totalShards: 5
      },
      shardStats: {
        indices: {
          totals: {
            unassigned: {
              primary: 0,
              replica: 5
            }
          }
        }
      }
    };
    const result = calculateClusterShards(body);
    expect(result.shardStats.indices.totals.unassigned.replica).to.be.eql(5);
    expect(result.shardStats.indices.totals.unassigned.primary).to.be.eql(0);
    expect(result.clusterStatus.totalShards).to.be.eql(10);
    expect(result.clusterStatus.unassignedShards).to.be.eql(5);
  });
});
