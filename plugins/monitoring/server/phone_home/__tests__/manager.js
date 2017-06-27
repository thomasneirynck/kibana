import expect from 'expect.js';
import sinon from 'sinon';
import { CONFIG_ALLOW_REPORT } from '../../../common/constants';
import { PhoneHomeManager } from '../manager';

describe('PhoneHomeManager', () => {
  const server = { };
  const sendClusters = sinon.stub();
  const sender = { sendClusters };

  describe('can send data', () => {
    const uiSettingsService = { get: () => true };

    it('sendIfDue returns true, then returns false', async () => {
      const getAllStatsForServer = sinon.stub();

      getAllStatsForServer.withArgs(server).returns(Promise.resolve([{}]));
      sendClusters.returns(Promise.resolve([{ statusCode: 200 }]));

      const manager = new PhoneHomeManager(server, uiSettingsService, sender, { getStats: getAllStatsForServer });

      expect(await manager.sendIfDue()).to.be(true);
      expect(await manager.sendIfDue()).to.be(false);

      expect(getAllStatsForServer.calledOnce).to.be(true);
    });

    it('send returns response from sender', async () => {
      const getAllStatsForServer = sinon.stub();

      const clusters = [ {} ];
      const responses = [ { statusCode: 200 } ];

      getAllStatsForServer.withArgs(server).returns(Promise.resolve(clusters));
      sendClusters.withArgs(clusters).returns(Promise.resolve(responses));

      const manager = new PhoneHomeManager(server, uiSettingsService, sender, { getStats: getAllStatsForServer });

      expect(await manager.send()).to.be(responses);

      expect(getAllStatsForServer.calledOnce).to.be(true);
    });
  });

  describe('should not send data', () => {
    it('sendIfDue returns true', async () => {
      const configAllowReport = sinon.stub();
      const uiSettingsService = { get: async (key, defaultValue) => configAllowReport(key, defaultValue) };
      const manager = new PhoneHomeManager(server, uiSettingsService, sender);

      configAllowReport.returns(false);

      expect(await manager.sendIfDue()).to.be(true);
      expect(await manager.sendIfDue()).to.be(true);
      expect(await manager.sendIfDue()).to.be(true);

      expect(configAllowReport.calledWith(CONFIG_ALLOW_REPORT, true)).to.be(true);
      expect(configAllowReport.callCount).to.eql(3);
    });

    it('send returns []', async () => {
      const configAllowReport = sinon.stub();
      const uiSettingsService = { get: async (key, defaultValue) => configAllowReport(key, defaultValue) };
      const manager = new PhoneHomeManager(server, uiSettingsService, sender);

      configAllowReport.returns(false);

      expect(await manager.send()).to.eql([]);

      expect(configAllowReport.calledWith(CONFIG_ALLOW_REPORT, true)).to.be(true);
      expect(configAllowReport.calledOnce).to.be(true);
    });
  });
});
