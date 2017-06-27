import expect from 'expect.js';
import sinon from 'sinon';
import { receivePhoneHome } from '../receive_phone_home';

describe('receivePhoneHome is disabled', () => {
  const callCluster = sinon.stub();
  const cluster = { cluster_uuid: 'abc123' };

  it('does not use callCluster', async () => {
    const response = await receivePhoneHome(callCluster, cluster);

    expect(response).to.eql({});
    expect(callCluster.called).to.be(false);
  });
});
