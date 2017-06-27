import expect from 'expect.js';
import sinon from 'sinon';
import { version } from '../../../../../package.json';
import { PhoneHomeSender } from '../sender';

describe('PhoneHomeSender', () => {
  const cluster = { cluster_uuid: 'abc123' };
  const callWithInternalUser = sinon.stub();
  const plugins = {
    elasticsearch: {
      getCluster: sinon.stub().withArgs('monitoring').returns({ callWithInternalUser })
    }
  };

  it('sendClusters sends clusters individually', async () => {
    let counter = 0;
    const get = sinon.stub();
    const server = {
      config: sinon.stub().returns({ get }),
      plugins
    };
    const receiver = () => ++counter;
    const sender = new PhoneHomeSender(server, { receiver });

    get.withArgs('xpack.monitoring.stats_report_url').returns('..');
    get.withArgs('server.uuid').returns('ignored');

    const clusterResponses = await sender.sendClusters([ cluster, { xyz: 'fake' }, { 'abc': 'faker' } ]);

    expect(clusterResponses.length).to.be(3);
    expect(clusterResponses).to.eql([ 1, 2, 3 ]);
  });

  it('sendCluster sends to internal route when not http', () => {
    const get = sinon.stub();
    const server = {
      config: sinon.stub().returns({ get }),
      plugins
    };
    const receiver = (callCluster, data) => {
      return { callCluster, data };
    };
    const sender = new PhoneHomeSender(server, { receiver });

    get.withArgs('xpack.monitoring.stats_report_url').returns('..');
    get.withArgs('server.uuid').returns('123');

    const internalRequest = sender._sendCluster(cluster);

    expect(internalRequest.callCluster).to.be(callWithInternalUser);
    expect(internalRequest.data.kibana_server.uuid).to.eql('123');
    expect(internalRequest.data.kibana_server.version).to.eql(version);
    expect(internalRequest.data.cluster_uuid).to.eql(cluster.cluster_uuid);
  });

  it('sendCluster sends to http route', async () => {
    const statsReportUrl = 'http://example.com/stats';
    const get = sinon.stub();
    const server = { config: sinon.stub().returns({ get }) };
    const httpRequestHandler = (req, callback) => callback(null, req);
    const sender = new PhoneHomeSender(server, { httpRequestHandler });

    get.withArgs('xpack.monitoring.stats_report_url').returns(statsReportUrl);
    get.withArgs('server.uuid').returns('456');

    const httpRequest = await sender._sendCluster(cluster);

    expect(httpRequest.uri).to.eql(statsReportUrl);
    expect(httpRequest.method).to.eql('POST');
    expect(httpRequest.headers['User-Agent']).to.eql(`Kibana Server ${version} (456)`);
    expect(httpRequest.json).to.eql(true);
    expect(httpRequest.body.data.kibana_server.uuid).to.eql('456');
    expect(httpRequest.body.data.kibana_server.version).to.eql(version);
    expect(httpRequest.body.data.cluster_uuid).to.eql(cluster.cluster_uuid);
  });
});
