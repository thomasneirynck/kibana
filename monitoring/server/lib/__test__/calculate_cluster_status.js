import calculateClusterStatus from '../calculate_cluster_status.js';
import expect from 'expect.js';
import _ from 'lodash';

describe('Calculating Cluster Status', () => {
  it('Calculates object', () => {
    let body = _.set({}, 'shardStats.totals.unassigned.replica', 5);
    body = _.set(body, 'shardStats.totals.unassigned.primary', 0);
    body = _.set(body, 'clusterStatus.totalShards', 5);
    const result = calculateClusterStatus(body);
    expect(result.shardStats.totals.unassigned.replica).to.be.eql(5);
    expect(result.shardStats.totals.unassigned.primary).to.be.eql(0);
    expect(result.clusterStatus.totalShards).to.be.eql(10);
    expect(result.clusterStatus.unassignedShards).to.be.eql(5);
  });
});
