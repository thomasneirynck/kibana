import { pick } from 'lodash';
import expect from 'expect.js';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import { WATCH_TYPES } from '../../../../common/constants';

const constructorMock = sinon.stub();
const upstreamJSONMock = sinon.stub();
const downstreamJSONMock = sinon.stub();
const getPropsFromUpstreamJSONMock = sinon.stub();
const getPropsFromDownstreamJSONMock = sinon.stub();
class BaseWatchStub {
  constructor(props) {
    constructorMock(props);
  }

  get upstreamJSON() {
    upstreamJSONMock();

    return {
      baseCalled: true
    };
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

  static getPropsFromDownstreamJSON(json) {
    getPropsFromDownstreamJSONMock();
    return pick(json, 'watchJson');
  }
}

const { JsonWatch } = proxyquire('../json_watch', {
  './base_watch': { BaseWatch: BaseWatchStub }
});

describe('JsonWatch', () => {

  describe('Constructor', () => {

    let props;
    beforeEach(() => {
      constructorMock.reset();

      props = {
        watch: 'foo',
        watchJson: 'bar'
      };
    });

    it('should call the BaseWatch constructor', () => {
      new JsonWatch(props);
      expect(constructorMock.called).to.be(true);
    });

    it('should populate all expected fields', () => {
      const actual = new JsonWatch(props);
      const expected = {
        watch: 'foo',
        watchJson: 'bar'
      };

      expect(actual).to.eql(expected);
    });

    it('should call the BaseWatch contructor with type of json', () => {
      props = {};
      new JsonWatch(props);
      expect(constructorMock.calledWith({ type: WATCH_TYPES.JSON })).to.be(true);
    });

  });

  describe('watchJSON getter method', () => {

    let props;
    beforeEach(() => {
      props = {
        watch: { foo: 'bar' }
      };
    });

    it('should return the correct result', () => {
      const watch = new JsonWatch(props);

      expect(watch.watchJSON).to.eql(props.watch);
    });

  });

  describe('upstreamJSON getter method', () => {

    beforeEach(() => {
      upstreamJSONMock.reset();
    });

    it('should call the getter from WatchBase and return the correct result', () => {
      const watch = new JsonWatch({ watch: 'foo' });
      const actual = watch.upstreamJSON;
      const expected = {
        baseCalled: true
      };

      expect(upstreamJSONMock.called).to.be(true);
      expect(actual).to.eql(expected);
    });

  });

  describe('downstreamJSON getter method', () => {

    let props;
    beforeEach(() => {
      downstreamJSONMock.reset();

      props = {
        watch: 'foo',
        watchJson: 'bar'
      };
    });

    it('should call the getter from WatchBase and return the correct result', () => {
      const watch = new JsonWatch(props);
      const actual = watch.downstreamJSON;
      const expected = {
        baseCalled: true,
        watch: 'foo'
      };

      expect(downstreamJSONMock.called).to.be(true);
      expect(actual).to.eql(expected);
    });

  });

  describe('fromUpstreamJSON factory method', () => {

    let upstreamJson;
    beforeEach(() => {
      getPropsFromUpstreamJSONMock.reset();

      upstreamJson = {
        watchJson: { foo: { bar: 'baz' } }
      };
    });

    it('should call the getPropsFromUpstreamJSON method of BaseWatch', () => {
      JsonWatch.fromUpstreamJSON(upstreamJson);

      expect(getPropsFromUpstreamJSONMock.called).to.be(true);
    });

    it('should clone the watchJson property into a watch property', () => {
      const jsonWatch = JsonWatch.fromUpstreamJSON(upstreamJson);

      expect(jsonWatch.watch).to.eql(upstreamJson.watchJson);
      expect(jsonWatch.watch).to.not.be(upstreamJson.watchJson);
    });

    it('should remove the metadata.name property from the watch property', () => {
      upstreamJson.watchJson.metadata = { name: 'foobar', foo: 'bar' };

      const jsonWatch = JsonWatch.fromUpstreamJSON(upstreamJson);

      expect(jsonWatch.watch.metadata.name).to.be(undefined);
    });

    it('should remove an empty metadata property from the watch property', () => {
      upstreamJson.watchJson.metadata = { name: 'foobar' };

      const jsonWatch = JsonWatch.fromUpstreamJSON(upstreamJson);

      expect(jsonWatch.watch.metadata).to.be(undefined);
    });

  });

  describe('fromDownstreamJSON factory method', () => {

    let downstreamJson;
    beforeEach(() => {
      getPropsFromDownstreamJSONMock.reset();

      downstreamJson = {
        watch: { foo: { bar: 'baz' } }
      };
    });

    it('should call the getPropsFromDownstreamJSON method of BaseWatch', () => {
      JsonWatch.fromDownstreamJSON(downstreamJson);

      expect(getPropsFromDownstreamJSONMock.called).to.be(true);
    });

    it('should copy the watch property', () => {
      const jsonWatch = JsonWatch.fromDownstreamJSON(downstreamJson);

      expect(jsonWatch.watch).to.eql(downstreamJson.watch);
    });

  });

});
