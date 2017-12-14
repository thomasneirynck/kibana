import { spy, stub } from 'sinon';
import expect from 'expect.js';
import { MonitoringViewBaseTableController } from '../';

describe('MonitoringViewBaseTableController', function () {

  let ctrl;
  let $injector;
  let $scope;
  let options;
  let timefilter;
  let titleService;
  let executorService;

  before(() => {
    timefilter = {
      enableTimeRangeSelector: spy(),
      enableAutoRefreshSelector: spy(),
      isTimeRangeSelectorEnabled: true,
      isAutoRefreshSelectorEnabled: true
    };
    titleService = spy();
    executorService = {
      register: spy(),
      start: spy()
    };

    const injectorGetStub = stub();
    injectorGetStub.withArgs('title').returns(titleService);
    injectorGetStub.withArgs('timefilter').returns(timefilter);
    injectorGetStub.withArgs('$executor').returns(executorService);
    injectorGetStub.withArgs('localStorage').returns({
      get: stub().returns({
        testoStorageKey: {
          pageIndex: 9000,
          filterText: 'table-ctrl-testoStorageKey',
          sortKey: 'test.testoStorageKey',
          sortOrder: -1
        }
      })
    });
    $injector = { get: injectorGetStub };

    $scope = {
      cluster: { cluster_uuid: 'foo' },
      $on: stub()
    };

    options = {
      title: 'testoTitle',
      storageKey: 'testoStorageKey',
      $injector,
      $scope
    };

    ctrl = new MonitoringViewBaseTableController(options);
  });

  it('initializes scope data from storage', () => {
    expect(ctrl.pageIndex).to.be(9000);
    expect(ctrl.filterText).to.be('table-ctrl-testoStorageKey');
    expect(ctrl.sortKey).to.be('test.testoStorageKey');
    expect(ctrl.sortOrder).to.be(-1);
  });

  it('creates functions for event handling and fetchiing data', () => {
    expect(ctrl.onNewState).to.be.a('function');
    expect(ctrl.updateData).to.be.a('function');
  });

  it('enables timepicker', () => {
    expect(timefilter.isTimeRangeSelectorEnabled).to.be(true);
    expect(timefilter.isAutoRefreshSelectorEnabled).to.be(true);
  });

  it('sets page title', () => {
    expect(titleService.calledOnce).to.be(true);
    const { args } = titleService.getCall(0);
    expect(args).to.eql([
      { cluster_uuid: 'foo' },
      'testoTitle'
    ]);
  });

  it('starts data poller', () => {
    expect(executorService.register.calledOnce).to.be(true);
    expect(executorService.start.calledOnce).to.be(true);
  });

});
