import expect from 'expect.js';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import { WATCH_TYPES } from '../../../../common/constants';

const watchTypeMocks = {};
function buildMock(watchType) {
  const fromDownstreamJSONMock = sinon.stub();
  const fromUpstreamJSONMock = sinon.stub();

  watchTypeMocks[watchType] = {
    fromDownstreamJSONMock,
    fromUpstreamJSONMock,
    Class: class WatchStub {
      static fromDownstreamJSON(...args) {
        fromDownstreamJSONMock(...args);
      }
      static fromUpstreamJSON(...args) {
        fromUpstreamJSONMock(...args);
      }
    }
  };
}

buildMock(WATCH_TYPES.JSON);
buildMock(WATCH_TYPES.THRESHOLD);
buildMock(WATCH_TYPES.MONITORING);

const { Watch } = proxyquire('../watch', {
  './json_watch': { JsonWatch: watchTypeMocks[WATCH_TYPES.JSON].Class },
  './monitoring_watch': { MonitoringWatch: watchTypeMocks[WATCH_TYPES.MONITORING].Class },
  './threshold_watch': { ThresholdWatch: watchTypeMocks[WATCH_TYPES.THRESHOLD].Class }
});

describe('watch', () => {

  describe('Watch', () => {

    describe('getWatchTypes factory method', () => {

      it(`There should be a property for each watch type`, () => {
        // NOTE: If this test is failing because a new watch type was added
        // make sure you add a 'returns an instance of' test for the new type
        // as well.

        const watchTypes = Watch.getWatchTypes();
        const expected = Object.values(WATCH_TYPES).sort();
        const actual = Object.keys(watchTypes).sort();

        expect(actual).to.eql(expected);
      });

    });

    describe('fromDownstreamJSON factory method', () => {

      beforeEach(() => {
        Object.keys(watchTypeMocks).forEach(key => {
          watchTypeMocks[key].fromDownstreamJSONMock.reset();
        });
      });

      it(`throws an error if no 'type' property in json`, () => {
        expect(Watch.fromDownstreamJSON).withArgs({})
          .to.throwError(/must contain an type property/i);
      });

      it(`throws an error if the type does not correspond to a WATCH_TYPES value`, () => {
        expect(Watch.fromDownstreamJSON).withArgs({ type: 'foo' })
          .to.throwError(/Attempted to load unknown type foo/i);
      });

      it('fromDownstreamJSON of JsonWatch to be called when type is WATCH_TYPES.JSON', () => {
        Watch.fromDownstreamJSON({ type: WATCH_TYPES.JSON });
        expect(watchTypeMocks[WATCH_TYPES.JSON].fromDownstreamJSONMock.called).to.be(true);
      });

      it('fromDownstreamJSON of ThresholdWatch to be called when type is WATCH_TYPES.THRESHOLD', () => {
        Watch.fromDownstreamJSON({ type: WATCH_TYPES.THRESHOLD });
        expect(watchTypeMocks[WATCH_TYPES.THRESHOLD].fromDownstreamJSONMock.called).to.be(true);
      });

      it('fromDownstreamJSON of MonitoringWatch to be called when type is WATCH_TYPES.MONITORING', () => {
        Watch.fromDownstreamJSON({ type: WATCH_TYPES.MONITORING });
        expect(watchTypeMocks[WATCH_TYPES.MONITORING].fromDownstreamJSONMock.called).to.be(true);
      });

    });

    describe('fromUpstreamJSON factory method', () => {

      beforeEach(() => {
        Object.keys(watchTypeMocks).forEach(key => {
          watchTypeMocks[key].fromUpstreamJSONMock.reset();
        });
      });

      it(`throws an error if no 'watchJson' property in json`, () => {
        expect(Watch.fromUpstreamJSON).withArgs({})
          .to.throwError(/must contain a watchJson property/i);
      });

      it('fromUpstreamJSON of JsonWatch to be called when type is WATCH_TYPES.JSON', () => {
        Watch.fromUpstreamJSON({
          watchJson: { metadata: { xpack: { type: WATCH_TYPES.JSON } } }
        });
        expect(watchTypeMocks[WATCH_TYPES.JSON].fromUpstreamJSONMock.called).to.be(true);
      });

      it('fromUpstreamJSON of ThresholdWatch to be called when type is WATCH_TYPES.THRESHOLD', () => {
        Watch.fromUpstreamJSON({
          watchJson: { metadata: { xpack: { type: WATCH_TYPES.THRESHOLD } } }
        });
        expect(watchTypeMocks[WATCH_TYPES.THRESHOLD].fromUpstreamJSONMock.called).to.be(true);
      });

      it('fromUpstreamJSON of MonitoringWatch to be called when type is WATCH_TYPES.MONITORING', () => {
        Watch.fromUpstreamJSON({
          watchJson: { metadata: { xpack: { type: WATCH_TYPES.MONITORING } } }
        });
        expect(watchTypeMocks[WATCH_TYPES.MONITORING].fromUpstreamJSONMock.called).to.be(true);
      });

    });

  });

});
