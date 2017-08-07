import { identity, noop } from 'lodash';
import sinon from 'sinon';
import expect from 'expect.js';
import { TypeCollector } from '../type_collector';

const DEBUG_LOG = [ 'debug', 'monitoring-ui', 'kibana-monitoring' ];
const WARNING_LOG = [ 'warning', 'monitoring-ui', 'kibana-monitoring' ];

const COLLECTOR_INTERVAL = 10000;
const CHECK_DELAY = 100; // can be lower than COLLECTOR_INTERVAL because the collectors use fetchAfterInit

describe('TypeCollector', () => {
  describe('registers a collector and runs lifecycle events', () => {
    it('for skipping bulk upload because payload is empty', (done) => {
      const log = sinon.spy();
      const init = noop;
      const fetch = noop;
      const cleanup = noop;

      const collector = new TypeCollector({
        interval: COLLECTOR_INTERVAL,
        logger: log,
        combineTypes: identity,
        onPayload: identity
      });

      collector.register({
        type: 'type_collector_test',
        fetchAfterInit: true, // FIXME: camelCasing
        init,
        fetch,
        cleanup
      });

      collector.start();

      // allow interval to tick a few times
      setTimeout(() => {
        collector.cleanup();

        expect(log.calledWith(DEBUG_LOG, 'Initializing type_collector_test collector')).to.be(true);
        expect(log.calledWith(DEBUG_LOG, 'Fetching data from type_collector_test collector')).to.be(true);
        expect(log.calledWith(DEBUG_LOG, 'Skipping bulk uploading of empty Kibana monitoring payload')).to.be(true); // proof of skip
        expect(log.calledWith(WARNING_LOG, 'Stopping all Kibana monitoring collectors')).to.be(true);
        expect(log.calledWith(DEBUG_LOG, 'Running type_collector_test cleanup')).to.be(true);

        done(); // for async exit
      }, CHECK_DELAY);
    });

    it('for running the bulk upload handler', (done) => {
      const log = sinon.spy();
      const combineTypes = sinon.spy(data => {
        return [
          data[0][0],
          { ...data[0][1], combined: true }
        ];
      });
      const onPayload = sinon.spy();

      const collector = new TypeCollector({
        interval: COLLECTOR_INTERVAL,
        logger: log,
        combineTypes,
        onPayload
      });

      const init = noop;
      const fetch = () => ({ testFetch: true });
      const cleanup = noop;
      collector.register({
        type: 'type_collector_test',
        fetchAfterInit: true, // FIXME: camelCasing
        init,
        fetch,
        cleanup
      });

      collector.start();

      // allow interval to tick a few times
      setTimeout(() => {
        collector.cleanup();

        expect(log.calledWith(DEBUG_LOG, 'Initializing type_collector_test collector')).to.be(true);
        expect(log.calledWith(DEBUG_LOG, 'Fetching data from type_collector_test collector')).to.be(true);
        expect(log.calledWith(DEBUG_LOG, 'Uploading bulk Kibana monitoring payload')).to.be(true);
        expect(log.calledWith(WARNING_LOG, 'Stopping all Kibana monitoring collectors')).to.be(true);
        expect(log.calledWith(DEBUG_LOG, 'Running type_collector_test cleanup')).to.be(true);

        // un-flattened
        expect(combineTypes.getCall(0).args[0]).to.eql(
          [ [ { index: { _type: 'type_collector_test' } }, { testFetch: true } ] ]
        );

        // flattened and altered
        expect(onPayload.getCall(0).args[0]).to.eql(
          [ { index: { _type: 'type_collector_test' } }, { testFetch: true, combined: true } ]
        );

        done(); // for async exit
      }, CHECK_DELAY);
    });
  });
});
