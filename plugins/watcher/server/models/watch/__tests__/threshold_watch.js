import { pick } from 'lodash';
import expect from 'expect.js';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import { WATCH_TYPES, COMPARATORS, SORT_ORDERS } from '../../../../common/constants';

const constructorMock = sinon.stub();
const upstreamJSONMock = sinon.stub();
const downstreamJSONMock = sinon.stub();
const getPropsFromUpstreamJSONMock = sinon.stub();
const getPropsFromDownstreamJSONMock = sinon.stub();
const buildTriggerMock = sinon.stub();
const buildInputMock = sinon.stub();
const buildConditionMock = sinon.stub();
const buildTransformMock = sinon.stub();
const buildActionsMock = sinon.stub();
const buildVisualizeQueryMock = sinon.stub();
const formatVisualizeDataMock = sinon.stub();
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

const { ThresholdWatch } = proxyquire('../threshold_watch/threshold_watch', {
  '../base_watch': { BaseWatch: BaseWatchStub },
  './build_actions': {
    buildActions: (...args) => {
      buildActionsMock(...args);
      return 'buildActionsResult';
    }
  },
  './build_condition': {
    buildCondition: (...args) => {
      buildConditionMock(...args);
      return 'buildConditionResult';
    }
  },
  './build_input': {
    buildInput: (...args) => {
      buildInputMock(...args);
      return 'buildInputResult';
    }
  },
  './build_transform': {
    buildTransform: (...args) => {
      buildTransformMock(...args);
      return 'buildTransformResult';
    }
  },
  './build_trigger': {
    buildTrigger: (...args) => {
      buildTriggerMock(...args);
      return 'buildTriggerResult';
    }
  },
  './build_visualize_query': {
    buildVisualizeQuery: (...args) => {
      buildVisualizeQueryMock(...args);
    }
  },
  './format_visualize_data': {
    formatVisualizeData: (...args) => {
      formatVisualizeDataMock(...args);
    }
  }
});

describe('watch', () => {

  describe('ThresholdWatch', () => {

    describe('Constructor', () => {

      let props;
      beforeEach(() => {
        constructorMock.reset();

        props = {
          index: 'index',
          timeField: 'timeField',
          triggerIntervalSize: 'triggerIntervalSize',
          triggerIntervalUnit: 'triggerIntervalUnit',
          aggType: 'aggType',
          aggField: 'aggField',
          termSize: 'termSize',
          termField: 'termField',
          thresholdComparator: 'thresholdComparator',
          timeWindowSize: 'timeWindowSize',
          timeWindowUnit: 'timeWindowUnit',
          threshold: 'threshold'
        };
      });

      it('should call the BaseWatch constructor', () => {
        new ThresholdWatch(props);
        expect(constructorMock.called).to.be(true);
      });

      it('should populate all expected fields', () => {
        const actual = new ThresholdWatch(props);
        const expected = {
          index: 'index',
          timeField: 'timeField',
          triggerIntervalSize: 'triggerIntervalSize',
          triggerIntervalUnit: 'triggerIntervalUnit',
          aggType: 'aggType',
          aggField: 'aggField',
          termSize: 'termSize',
          termField: 'termField',
          thresholdComparator: 'thresholdComparator',
          timeWindowSize: 'timeWindowSize',
          timeWindowUnit: 'timeWindowUnit',
          threshold: 'threshold'
        };

        expect(actual).to.eql(expected);
      });

      it('should call the BaseWatch contructor with type of json', () => {
        props = {};
        new ThresholdWatch(props);
        expect(constructorMock.calledWith({ type: WATCH_TYPES.THRESHOLD })).to.be(true);
      });

    });

    describe('hasTermAgg getter method', () => {

      it('should return true if termField is defined', () => {
        const downstreamJson = { termField: 'foobar' };
        const thresholdWatch = ThresholdWatch.fromDownstreamJSON(downstreamJson);

        expect(thresholdWatch.hasTermsAgg).to.be(true);
      });

      it('should return false if termField is undefined', () => {
        const downstreamJson = { termField: undefined };
        const thresholdWatch = ThresholdWatch.fromDownstreamJSON(downstreamJson);

        expect(thresholdWatch.hasTermsAgg).to.be(false);
      });

    });

    describe('termOrder getter method', () => {

      it('should return SORT_ORDERS.DESCENDING if thresholdComparator is COMPARATORS.GREATER_THAN', () => {
        const downstreamJson = { thresholdComparator: COMPARATORS.GREATER_THAN };
        const thresholdWatch = ThresholdWatch.fromDownstreamJSON(downstreamJson);

        expect(thresholdWatch.termOrder).to.be(SORT_ORDERS.DESCENDING);
      });

      it('should return SORT_ORDERS.ASCENDING if thresholdComparator is not COMPARATORS.GREATER_THAN', () => {
        const downstreamJson = { thresholdComparator: 'foo' };
        const thresholdWatch = ThresholdWatch.fromDownstreamJSON(downstreamJson);

        expect(thresholdWatch.termOrder).to.be(SORT_ORDERS.ASCENDING);
      });

    });

    describe('watchJSON getter method', () => {

      beforeEach(() => {
        buildActionsMock.reset();
        buildConditionMock.reset();
        buildInputMock.reset();
        buildTransformMock.reset();
        buildTriggerMock.reset();
      });

      it('should return the correct result', () => {
        const watch = new ThresholdWatch({});
        const actual = watch.watchJSON;
        const expected = {
          trigger: 'buildTriggerResult',
          input: 'buildInputResult',
          condition: 'buildConditionResult',
          transform: 'buildTransformResult',
          actions: 'buildActionsResult'
        };

        expect(actual).to.eql(expected);
        expect(buildActionsMock.calledWith(watch)).to.be(true);
        expect(buildConditionMock.calledWith(watch)).to.be(true);
        expect(buildInputMock.calledWith(watch)).to.be(true);
        expect(buildTransformMock.calledWith(watch)).to.be(true);
        expect(buildTriggerMock.calledWith(watch)).to.be(true);
      });

    });

    describe('getVisualizeQuery method', () => {

      beforeEach(() => {
        buildVisualizeQueryMock.reset();
      });

      it('should call the external buildVisualizeQuery method', () => {
        const watch = new ThresholdWatch({});
        const options = { foo: 'bar' };
        watch.getVisualizeQuery(options);

        expect(buildVisualizeQueryMock.calledWith(watch, options)).to.be(true);
      });

    });

    describe('formatVisualizeData method', () => {

      beforeEach(() => {
        formatVisualizeDataMock.reset();
      });

      it('should call the external formatVisualizeData method', () => {
        const watch = new ThresholdWatch({});
        const results = { foo: 'bar' };
        watch.formatVisualizeData(results);

        expect(formatVisualizeDataMock.calledWith(watch, results)).to.be(true);
      });

    });

    describe('upstreamJSON getter method', () => {

      let props;
      beforeEach(() => {
        upstreamJSONMock.reset();

        props = {
          index: 'index',
          timeField: 'timeField',
          triggerIntervalSize: 'triggerIntervalSize',
          triggerIntervalUnit: 'triggerIntervalUnit',
          aggType: 'aggType',
          aggField: 'aggField',
          termSize: 'termSize',
          termField: 'termField',
          thresholdComparator: 'thresholdComparator',
          timeWindowSize: 'timeWindowSize',
          timeWindowUnit: 'timeWindowUnit',
          threshold: 'threshold'
        };
      });

      it('should call the getter from WatchBase and return the correct result', () => {
        const watch = new ThresholdWatch(props);
        const actual = watch.upstreamJSON;
        const expected = {
          baseCalled: true,
          watch: {
            metadata: {
              watcherui: {
                index: 'index',
                timeField: 'timeField',
                triggerIntervalSize: 'triggerIntervalSize',
                triggerIntervalUnit: 'triggerIntervalUnit',
                aggType: 'aggType',
                aggField: 'aggField',
                termSize: 'termSize',
                termField: 'termField',
                thresholdComparator: 'thresholdComparator',
                timeWindowSize: 'timeWindowSize',
                timeWindowUnit: 'timeWindowUnit',
                threshold: 'threshold'
              }
            }
          }
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
          index: 'index',
          timeField: 'timeField',
          triggerIntervalSize: 'triggerIntervalSize',
          triggerIntervalUnit: 'triggerIntervalUnit',
          aggType: 'aggType',
          aggField: 'aggField',
          termSize: 'termSize',
          termField: 'termField',
          thresholdComparator: 'thresholdComparator',
          timeWindowSize: 'timeWindowSize',
          timeWindowUnit: 'timeWindowUnit',
          threshold: 'threshold'
        };
      });

      it('should call the getter from WatchBase and return the correct result', () => {
        const watch = new ThresholdWatch(props);
        const actual = watch.downstreamJSON;
        const expected = {
          baseCalled: true,
          index: 'index',
          timeField: 'timeField',
          triggerIntervalSize: 'triggerIntervalSize',
          triggerIntervalUnit: 'triggerIntervalUnit',
          aggType: 'aggType',
          aggField: 'aggField',
          termSize: 'termSize',
          termField: 'termField',
          thresholdComparator: 'thresholdComparator',
          timeWindowSize: 'timeWindowSize',
          timeWindowUnit: 'timeWindowUnit',
          threshold: 'threshold'
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
          watchJson: {
            foo: { bar: 'baz' },
            metadata: {
              watcherui: {
                index: 'index',
                timeField: 'timeField',
                triggerIntervalSize: 'triggerIntervalSize',
                triggerIntervalUnit: 'triggerIntervalUnit',
                aggType: 'aggType',
                aggField: 'aggField',
                termSize: 'termSize',
                termField: 'termField',
                thresholdComparator: 'thresholdComparator',
                timeWindowSize: 'timeWindowSize',
                timeWindowUnit: 'timeWindowUnit',
                threshold: 'threshold'
              }
            }
          }
        };
      });

      it('should call the getPropsFromUpstreamJSON method of BaseWatch', () => {
        ThresholdWatch.fromUpstreamJSON(upstreamJson);

        expect(getPropsFromUpstreamJSONMock.called).to.be(true);
      });

      it('should generate a valid ThresholdWatch object', () => {
        const actual = ThresholdWatch.fromUpstreamJSON(upstreamJson);
        const expected = {
          index: "index",
          timeField: "timeField",
          triggerIntervalSize: "triggerIntervalSize",
          triggerIntervalUnit: "triggerIntervalUnit",
          aggType: "aggType",
          aggField: "aggField",
          termSize: "termSize",
          termField: "termField",
          thresholdComparator: "thresholdComparator",
          timeWindowSize: "timeWindowSize",
          timeWindowUnit: "timeWindowUnit",
          threshold: "threshold"
        };

        expect(actual).to.eql(expected);
      });

    });

    describe('fromDownstreamJSON factory method', () => {

      let downstreamJson;
      beforeEach(() => {
        getPropsFromDownstreamJSONMock.reset();

        downstreamJson = {
          index: 'index',
          timeField: 'timeField',
          triggerIntervalSize: 'triggerIntervalSize',
          triggerIntervalUnit: 'triggerIntervalUnit',
          aggType: 'aggType',
          aggField: 'aggField',
          termSize: 'termSize',
          termField: 'termField',
          thresholdComparator: 'thresholdComparator',
          timeWindowSize: 'timeWindowSize',
          timeWindowUnit: 'timeWindowUnit',
          threshold: 'threshold'
        };
      });

      it('should call the getPropsFromDownstreamJSON method of BaseWatch', () => {
        ThresholdWatch.fromDownstreamJSON(downstreamJson);

        expect(getPropsFromDownstreamJSONMock.called).to.be(true);
      });

      it('should generate a valid ThresholdWatch object', () => {
        const actual = ThresholdWatch.fromDownstreamJSON(downstreamJson);
        const expected = {
          index: "index",
          timeField: "timeField",
          triggerIntervalSize: "triggerIntervalSize",
          triggerIntervalUnit: "triggerIntervalUnit",
          aggType: "aggType",
          aggField: "aggField",
          termSize: "termSize",
          termField: "termField",
          thresholdComparator: "thresholdComparator",
          timeWindowSize: "timeWindowSize",
          timeWindowUnit: "timeWindowUnit",
          threshold: "threshold"
        };

        expect(actual).to.eql(expected);
      });

    });

  });

});
