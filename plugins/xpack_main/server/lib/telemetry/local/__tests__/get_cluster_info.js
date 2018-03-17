import expect from 'expect.js';
import sinon from 'sinon';

import { getClusterInfo } from '../get_cluster_info';

export function mockGetClusterInfo(callCluster, clusterInfo) {
  callCluster.withArgs('info').returns(clusterInfo);
}

describe('get_cluster_info', () => {

  it('uses callCluster to get info API', () => {
    const callCluster = sinon.stub();
    const response = Promise.resolve({});

    mockGetClusterInfo(callCluster, response);

    expect(getClusterInfo(callCluster)).to.be(response);
  });

});
