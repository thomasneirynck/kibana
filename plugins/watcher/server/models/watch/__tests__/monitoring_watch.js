import { pick } from 'lodash';
import expect from 'expect.js';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import { WATCH_TYPES } from '../../../../common/constants';

const constructorMock = sinon.stub();
const downstreamJSONMock = sinon.stub();
const getPropsFromUpstreamJSONMock = sinon.stub();
class BaseWatchStub {
  constructor(props) {
    constructorMock(props);
  }

  get downstreamJSON() {
    downstreamJSONMock();

    return {
      baseCalled: true
    };
  }

  static getPropsFromUpstreamJSON(json) {
    getPropsFromUpstreamJSONMock();
    return pick(json, 'watchJson');
  }
}

const { MonitoringWatch } = proxyquire('../monitoring_watch', {
  './base_watch': { BaseWatch: BaseWatchStub }
});

describe('watch', () => {

  describe('MonitoringWatch', () => {

    describe('Constructor', () => {

      let props;
      beforeEach(() => {
        constructorMock.reset();

        props = {};
      });

      it('should call the BaseWatch constructor', () => {
        new MonitoringWatch(props);
        expect(constructorMock.called).to.be(true);
      });

      it('should populate all expected fields', () => {
        const actual = new MonitoringWatch(props);
        const expected = {
          isSystemWatch: true
        };

        expect(actual).to.eql(expected);
      });

      it('should call the BaseWatch contructor with type of json', () => {
        props = {};
        new MonitoringWatch(props);
        expect(constructorMock.calledWith({ type: WATCH_TYPES.MONITORING })).to.be(true);
      });

    });

    describe('watchJson getter method', () => {

      it('should return an empty object', () => {
        const watch = new MonitoringWatch({});
        const actual = watch.watchJSON;
        const expected = {};

        expect(actual).to.eql(expected);
      });

    });

    describe('getVisualizeQuery method', () => {

      it(`throws an error`, () => {
        const watch = new MonitoringWatch({});

        expect(watch.getVisualizeQuery).to.throwError(/getVisualizeQuery called for monitoring watch/i);
      });

    });

    describe('formatVisualizeData method', () => {

      it(`throws an error`, () => {
        const watch = new MonitoringWatch({});

        expect(watch.formatVisualizeData).to.throwError(/formatVisualizeData called for monitoring watch/i);
      });

    });

    describe('upstreamJSON getter method', () => {

      it(`throws an error`, () => {
        const watch = new MonitoringWatch({});

        expect(() => watch.upstreamJSON).to.throwError(/upstreamJSON called for monitoring watch/i);
      });

    });

    describe('downstreamJSON getter method', () => {

      let props;
      beforeEach(() => {
        downstreamJSONMock.reset();

        props = {};
      });

      it('should call the getter from WatchBase and return the correct result', () => {
        const watch = new MonitoringWatch(props);
        const actual = watch.downstreamJSON;
        const expected = {
          baseCalled: true
        };

        expect(downstreamJSONMock.called).to.be(true);
        expect(actual).to.eql(expected);
      });

    });

    describe('fromUpstreamJSON factory method', () => {

      beforeEach(() => {
        getPropsFromUpstreamJSONMock.reset();
      });

      it('should call the getPropsFromUpstreamJSON method of BaseWatch', () => {
        MonitoringWatch.fromUpstreamJSON({});

        expect(getPropsFromUpstreamJSONMock.called).to.be(true);
      });

      it('should generate a valid MonitoringWatch object', () => {
        const actual = MonitoringWatch.fromUpstreamJSON({});
        const expected = { isSystemWatch: true };

        expect(actual).to.eql(expected);
      });

    });

    describe('fromDownstreamJSON factory method', () => {

      it(`throws an error`, () => {
        expect(MonitoringWatch.fromDownstreamJSON).withArgs({})
          .to.throwError(/fromDownstreamJSON called for monitoring watch/i);
      });

    });

  });

});
