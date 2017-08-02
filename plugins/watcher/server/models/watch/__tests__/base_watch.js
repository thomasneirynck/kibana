import proxyquire from 'proxyquire';
import expect from 'expect.js';
import sinon from 'sinon';

const actionFromUpstreamJSONMock = sinon.stub();
const actionFromDownstreamJSONMock = sinon.stub();
const watchStatusFromUpstreamJSONMock = sinon.stub();
class ActionStub {
  static fromUpstreamJSON(...args) {
    actionFromUpstreamJSONMock(...args);
    return { foo: 'bar' };
  }

  static fromDownstreamJSON(...args) {
    actionFromDownstreamJSONMock(...args);
    return { foo: 'bar' };
  }
}

class WatchStatusStub {
  static fromUpstreamJSON(...args) {
    watchStatusFromUpstreamJSONMock(...args);
    return { foo: 'bar' };
  }
}

const { BaseWatch } = proxyquire('../base_watch', {
  '../action': { Action: ActionStub },
  '../watch_status': { WatchStatus: WatchStatusStub }
});

describe('BaseWatch', () => {

  describe('Constructor', () => {

    let props;
    beforeEach(() => {
      props = {
        id: 'my-watch',
        name: 'foo',
        type: 'logging'
      };
    });

    it('should return a valid object', () => {
      const watch = new BaseWatch(props);
      const actual = Object.keys(watch);
      const expected = [
        'id',
        'name',
        'type',
        'isSystemWatch',
        'watchStatus',
        'actions'
      ];

      expect(actual).to.eql(expected);
    });

    it('should default isSystemWatch to false', () => {
      const watch = new BaseWatch(props);

      expect(watch.isSystemWatch).to.be(false);
    });

    it('populates all expected fields', () => {
      props.watchStatus = 'bar';
      props.actions = 'baz';

      const actual = new BaseWatch(props);
      const expected = {
        id: 'my-watch',
        name: 'foo',
        type: 'logging',
        isSystemWatch: false,
        watchStatus: 'bar',
        actions: 'baz'
      };

      expect(actual).to.eql(expected);
    });

  });

  describe('watchJson getter method', () => {

    let props;
    beforeEach(() => {
      props = {
        id: 'my-watch',
        name: 'foo',
        type: 'logging'
      };
    });

    it('should return the expected object', () => {
      const watch = new BaseWatch(props);
      const actual = watch.watchJSON;
      const expected = {
        metadata: {
          name: 'foo',
          xpack: {
            type: 'logging'
          }
        }
      };

      expect(actual).to.eql(expected);
    });

    it('should only populate the name metadata if a name is defined', () => {
      delete props.name;
      const watch = new BaseWatch(props);
      const actual = watch.watchJSON;
      const expected = {
        metadata: {
          xpack: {
            type: props.type
          }
        }
      };

      expect(actual).to.eql(expected);
    });

  });

  describe('getVisualizeQuery getter method', () => {

    it('should return an empty object', () => {
      const watch = new BaseWatch({});
      const actual = watch.getVisualizeQuery();
      const expected = {};

      expect(actual).to.eql(expected);
    });

  });

  describe('formatVisualizeData getter method', () => {

    it('should return an empty array', () => {
      const watch = new BaseWatch({});
      const actual = watch.formatVisualizeData();
      const expected = [];

      expect(actual).to.eql(expected);
    });

  });

  describe('downstreamJSON getter method', () => {

    let props;
    beforeEach(() => {
      props = {
        id: 'foo',
        name: 'bar',
        type: 'json',
        watchStatus: {
          downstreamJSON: {
            prop1: 'prop1',
            prop2: 'prop2'
          }
        },
        actions: [{
          downstreamJSON: {
            prop1: 'prop3',
            prop2: 'prop4'
          }
        }]
      };
    });

    it('should return a valid object', () => {
      const watch = new BaseWatch(props);

      const actual = watch.downstreamJSON;
      const expected = {
        id: props.id,
        name: props.name,
        type: props.type,
        isSystemWatch: false,
        watchStatus: props.watchStatus.downstreamJSON,
        actions: props.actions.map(a => a.downstreamJSON)
      };

      expect(actual).to.eql(expected);
    });

    it('should respect an undefined watchStatus prop', () => {
      delete props.watchStatus;

      const watch = new BaseWatch(props);
      const actual = watch.downstreamJSON;

      const expected = {
        id: props.id,
        name: props.name,
        type: props.type,
        isSystemWatch: false,
        watchStatus: undefined,
        actions: props.actions.map(a => a.downstreamJSON)
      };

      expect(actual).to.eql(expected);
    });

  });

  describe('upstreamJSON getter method', () => {

    let props;
    beforeEach(() => {
      props = {
        id: 'foo',
        name: 'bar',
        type: 'json',
        watchStatus: {
          downstreamJSON: {
            prop1: 'prop1',
            prop2: 'prop2'
          }
        },
        actions: [{
          downstreamJSON: {
            prop1: 'prop3',
            prop2: 'prop4'
          }
        }]
      };
    });

    it('should return a valid object', () => {
      const watch = new BaseWatch(props);

      const actual = watch.upstreamJSON;
      const expected = {
        id: props.id,
        watch: {
          metadata: {
            name: props.name,
            xpack: {
              type: props.type
            }
          }
        }
      };

      expect(actual).to.eql(expected);
    });

  });

  describe('getPropsFromDownstreamJSON method', () => {

    let downstreamJson;
    beforeEach(() => {
      actionFromDownstreamJSONMock.reset();

      downstreamJson = {
        id: 'my-watch',
        name: 'foo',
        actions: []
      };
    });

    it('should return a valid props object', () => {
      const props = BaseWatch.getPropsFromDownstreamJSON(downstreamJson);
      const actual = Object.keys(props);
      const expected = [
        'id',
        'name',
        'actions'
      ];

      expect(actual).to.eql(expected);
    });

    it('should properly map id and name', () => {
      const props = BaseWatch.getPropsFromDownstreamJSON(downstreamJson);
      expect(props.id).to.be('my-watch');
      expect(props.name).to.be('foo');
    });

    it('should return an actions property that is an array', () => {
      const props = BaseWatch.getPropsFromDownstreamJSON(downstreamJson);

      expect(Array.isArray(props.actions)).to.be(true);
      expect(props.actions.length).to.be(0);
    });

    it('should call Action.fromUDownstreamJSON for each action', () => {
      const action0 = { type: 'email', id: 'email1' };
      const action1 = { type: 'logging', id: 'logging1' };

      downstreamJson.actions.push(action0);
      downstreamJson.actions.push(action1);

      const props = BaseWatch.getPropsFromDownstreamJSON(downstreamJson);

      expect(props.actions.length).to.be(2);
      expect(actionFromDownstreamJSONMock.calledWith(action0)).to.be(true);
      expect(actionFromDownstreamJSONMock.calledWith(action1)).to.be(true);
    });

  });

  describe('getPropsFromUpstreamJSON method', () => {

    let upstreamJson;
    beforeEach(() => {
      actionFromUpstreamJSONMock.reset();
      watchStatusFromUpstreamJSONMock.reset();

      upstreamJson = {
        id: 'my-watch',
        type: 'json',
        watchJson: {
          metadata: {
            name: 'foo'
          },
          condition: {
            never: {}
          }
        },
        watchStatusJson: {
          state: {
            active: true
          }
        }
      };
    });

    it(`throws an error if no 'id' property in json`, () => {
      delete upstreamJson.id;

      expect(BaseWatch.getPropsFromUpstreamJSON).withArgs(upstreamJson)
        .to.throwError(/must contain an id property/i);
    });

    it(`throws an error if no 'watchJson' property in json`, () => {
      delete upstreamJson.watchJson;

      expect(BaseWatch.getPropsFromUpstreamJSON).withArgs(upstreamJson)
        .to.throwError(/must contain a watchJson property/i);
    });

    it(`throws an error if no 'watchStatusJson' property in json`, () => {
      delete upstreamJson.watchStatusJson;

      expect(BaseWatch.getPropsFromUpstreamJSON).withArgs(upstreamJson)
        .to.throwError(/must contain a watchStatusJson property/i);
    });

    it(`should ignore unknown watchJson properties`, () => {
      upstreamJson.watchJson = {
        foo: 'foo',
        bar: 'bar',
        trigger: {},
        input: {},
        condition: {},
        actions: {},
        metadata: {},
        transform: {},
        throttle_period: {},
        throttle_period_in_millis: {}
      };

      const props = BaseWatch.getPropsFromUpstreamJSON(upstreamJson);
      const actual = Object.keys(props.watchJson);
      const expected = [
        'trigger',
        'input',
        'condition',
        'actions',
        'metadata',
        'transform',
        'throttle_period',
        'throttle_period_in_millis'
      ];

      expect(actual).to.eql(expected);
    });

    it('should return a valid props object', () => {
      const props = BaseWatch.getPropsFromUpstreamJSON(upstreamJson);
      const actual = Object.keys(props);
      const expected = [
        'id',
        'name',
        'watchJson',
        'watchStatus',
        'actions'
      ];

      expect(actual).to.eql(expected);
    });

    it('should pull name out of metadata', () => {
      const props = BaseWatch.getPropsFromUpstreamJSON(upstreamJson);

      expect(props.name).to.be('foo');
    });

    it('should return an actions property that is an array', () => {
      const props = BaseWatch.getPropsFromUpstreamJSON(upstreamJson);

      expect(Array.isArray(props.actions)).to.be(true);
      expect(props.actions.length).to.be(0);
    });

    it('should call Action.fromUpstreamJSON for each action', () => {
      upstreamJson.watchJson.actions = {
        'my-logging-action': {
          'logging': {
            'text': 'foo'
          }
        },
        'my-unknown-action': {
          'foobar': {}
        }
      };

      const props = BaseWatch.getPropsFromUpstreamJSON(upstreamJson);

      expect(props.actions.length).to.be(2);
      expect(actionFromUpstreamJSONMock.calledWith({
        id: 'my-logging-action',
        actionJson: {
          'logging': {
            'text': 'foo'
          }
        }
      })).to.be(true);
      expect(actionFromUpstreamJSONMock.calledWith({
        id: 'my-unknown-action',
        actionJson: {
          'foobar': {}
        }
      })).to.be(true);
    });

    it('should call WatchStatus.fromUpstreamJSON for the watch status', () => {
      BaseWatch.getPropsFromUpstreamJSON(upstreamJson);

      expect(watchStatusFromUpstreamJSONMock.calledWith({
        id: 'my-watch',
        watchStatusJson: {
          state: {
            active: true
          }
        }
      })).to.be(true);
    });

  });

});
