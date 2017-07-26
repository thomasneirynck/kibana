import expect from 'expect.js';
import sinon from 'sinon';
import { PhoneHome } from '../phone_home';
import { uiModules } from 'ui/modules';

uiModules.get('kibana')
  // disable stat reporting while running tests,
  // MockInjector used in these tests is not impacted
  .constant('reportStats', false)
  .constant('statsReportUrl', 'not.a.valid.url.0');

const getMockInjector = ({ allowReport, lastReport }) => {
  const get = sinon.stub();
  get.withArgs('reportStats').returns(true);
  get.withArgs('localStorage').returns({
    get: sinon.stub().returns({ lastReport: lastReport }),
    set: sinon.stub()
  });
  get.withArgs('config').returns({
    get: () => allowReport
  });
  const mockHttp = (req) => {
    return req;
  };
  mockHttp.post = () => Promise.resolve({
    data: [
      { cluster_uuid: 'fake-123', },
      { cluster_uuid: 'fake-456' }
    ]
  });
  mockHttp.get = (url) => Promise.resolve({
    data: [
      url,
      { info: true }
    ]
  });

  get.withArgs('$http').returns(mockHttp);
  get.withArgs('statsReportUrl').returns('https://testo.com/');

  return { get };
};
const mockBasePath = '/testo';

describe('phone home class', () => {
  it('start method for beginning a timer', () => {
    const sender = new PhoneHome(getMockInjector({ allowReport: true }), mockBasePath);
    expect(sender.start).to.be.a('function');
  });

  // call the private method
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('should send a report', () => {
    it('never reported before', () => {
      const sender = new PhoneHome(
        getMockInjector({ allowReport: true }),
        mockBasePath
      );
      return sender._sendIfDue()
      .then(result => {
        expect(result).to.eql([
          {
            data: [ '/testo/api/monitoring/v1/clusters/fake-123/info', { info: true } ],
            kbnXsrfToken: false,
            method: 'POST',
            url: 'https://testo.com/'
          },
          {
            data: [ '/testo/api/monitoring/v1/clusters/fake-456/info', { info: true } ],
            kbnXsrfToken: false,
            method: 'POST',
            url: 'https://testo.com/'
          }
        ]);
      });
    });

    it('interval check finds last report over a day ago', () => {
      const sender = new PhoneHome(
        getMockInjector({
          allowReport: true,
          lastReport: (new Date()).getTime() - 86401000 // reported 1 day + 1 second ago
        }),
        mockBasePath
      );
      return sender._sendIfDue()
      .then(result => expect(result).to.eql([
        {
          data: [ '/testo/api/monitoring/v1/clusters/fake-123/info', { info: true } ],
          kbnXsrfToken: false,
          method: 'POST',
          url: 'https://testo.com/'
        },
        {
          data: [ '/testo/api/monitoring/v1/clusters/fake-456/info', { info: true } ],
          kbnXsrfToken: false,
          method: 'POST',
          url: 'https://testo.com/'
        }
      ]));
    });
  });
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('should not send the report', () => {
    it('config does not allow report', () => {
      const sender = new PhoneHome(getMockInjector({ allowReport: false }), mockBasePath);
      return sender._sendIfDue()
      .then(result => expect(result).to.be(null));
    });

    it('interval check finds last report less than a day ago', () => {
      const sender = new PhoneHome(getMockInjector(
        {
          allowReport: true,
          lastReport: (new Date()).getTime() - 82800000 // reported 23 hours ago
        }),
        mockBasePath
      );
      return sender._sendIfDue()
      .then(result => expect(result).to.be(null));
    });
  });
});
