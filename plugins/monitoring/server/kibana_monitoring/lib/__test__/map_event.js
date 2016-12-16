import { rollupEvent, mapEvent } from '../map_event';
import expect from 'expect.js';
import sinon from 'sinon';
import v8 from 'v8';
import _ from 'lodash';

describe('Map Event', () => {
  const heapStats = v8.getHeapStatistics();
  const event = {
    host: 'my-host',
    concurrents: {
      '5603': 4,
      '5604': 6
    },
    osload: [1, 5, 15], // 1m, 5m, 15m; values used to easily compare
    osmem: {
      free: 2147483656, // just over half so that the difference is not equal
      total: 4294967296
    },
    osup: 15, // seconds
    psdelay: 30, // millis
    psmem: {
      heapTotal: 1073741824,
      heapUsed: 536870914,
      rss: 1342177280
    },
    psup: 9, // seconds
    requests: {
      '5603': {
        total: 1,
        disconnects: 6
      },
      '5604': {
        total: 6,
        disconnects: 44,
        statusCodes: {
          '200': 2,
          '201': 4
        }
      }
    },
    responseTimes: {
      '5603': {
        avg: 1,
        max: 10
      },
      '5604': {
        avg: 3,
        max: 200
      }
    }
  };
  const lastOp = {
    host: event.host,
    rollup: rollupEvent(event, null)
  };

  it('rollupEvent uses event values given nothing', () => {
    const rollup = lastOp.rollup;

    expect(rollup.concurrent_connections).to.be(10);
    expect(rollup.os.load['1m']).to.be(1);
    expect(rollup.os.load['5m']).to.be(5);
    expect(rollup.os.load['15m']).to.be(15);
    expect(rollup.os.memory.free_in_bytes).to.be(2147483656);
    expect(rollup.os.memory.total_in_bytes).to.be(4294967296);
    expect(rollup.os.memory.used_in_bytes).to.be(2147483640);
    expect(rollup.os.uptime_in_millis).to.be(15000);
    expect(rollup.process.event_loop_delay).to.be(30);
    expect(rollup.process.memory.heap.total_in_bytes).to.be(1073741824);
    expect(rollup.process.memory.heap.used_in_bytes).to.be(536870914);
    expect(rollup.process.memory.heap.size_limit).to.be(heapStats.heap_size_limit);
    expect(rollup.process.memory.resident_set_size_in_bytes).to.be(1342177280);
    expect(rollup.process.uptime_in_millis).to.be(9000);
    expect(rollup.requests.total).to.be(7);
    expect(rollup.requests.disconnects).to.be(50);
    expect(rollup.requests.status_codes['200']).to.be(2);
    expect(rollup.requests.status_codes['201']).to.be(4);
    expect(rollup.response_times.average).to.be(3);
    expect(rollup.response_times.max).to.be(200);
    expect(rollup.timestamp).to.be.a('string');
  });

  it('rollupEvent combines event with previous event rollup', () => {
    // memory/os stats use the latest event's details
    const newEvent = {
      concurrents: {
        '5603': 1
      },
      osload: [0.5, 2.5, 7.5],
      osmem: {
        free: 2147483696,
        total: 4294967296
      },
      osup: 20,
      psdelay: 10,
      psmem: {
        heapTotal: 536870912,
        heapUsed: 268435457,
        rss: 671088640
      },
      psup: 14,
      requests: {
        '5603': {
          total: 1,
          disconnects: 2,
          statusCodes: {
            '200': 1
          }
        }
      },
      responseTimes: {
        '5603': {
          avg: 10,
          max: 10
        }
      }
    };
    const rollup = rollupEvent(newEvent, lastOp);

    expect(rollup.concurrent_connections).to.be(11);
    expect(rollup.os.load['1m']).to.be(0.5);
    expect(rollup.os.load['5m']).to.be(2.5);
    expect(rollup.os.load['15m']).to.be(7.5);
    expect(rollup.os.memory.free_in_bytes).to.be(2147483696);
    expect(rollup.os.memory.total_in_bytes).to.be(4294967296);
    expect(rollup.os.memory.used_in_bytes).to.be(2147483600);
    expect(rollup.os.uptime_in_millis).to.be(20000);
    expect(rollup.process.event_loop_delay).to.be(40);
    expect(rollup.process.memory.heap.total_in_bytes).to.be(536870912);
    expect(rollup.process.memory.heap.used_in_bytes).to.be(268435457);
    expect(rollup.process.memory.heap.size_limit).to.be(heapStats.heap_size_limit);
    expect(rollup.process.memory.resident_set_size_in_bytes).to.be(671088640);
    expect(rollup.process.uptime_in_millis).to.be(14000);
    expect(rollup.requests.total).to.be(8);
    expect(rollup.requests.disconnects).to.be(52);
    expect(rollup.requests.status_codes['200']).to.be(3);
    expect(rollup.requests.status_codes['201']).to.be(4);
    expect(rollup.response_times.average).to.be(10);
    expect(rollup.response_times.max).to.be(200);
    expect(rollup.timestamp).to.be.a('string');
  });

  function getMockConfig() {
    const config = { get: sinon.stub() };
    config.get.withArgs('server.host').returns('myhost');
    config.get.withArgs('server.name').returns('kibana123');
    config.get.withArgs('server.port').returns('7890');
    config.get.withArgs('server.uuid').returns('xyz123');
    return config;
  }

  function getMockServerInfo() {
    const serverInfo = { status: { toJSON: sinon.stub() }, version: '1.2.3' };
    serverInfo.status.toJSON.withArgs().returns({ overall: { state: 'mocked' } });
    return serverInfo;
  }

  it('mapEvent uses rollup and host', () => {
    const config = getMockConfig();
    const serverInfo = getMockServerInfo();
    const mappedEvent = mapEvent(lastOp, config, serverInfo);

    expect(mappedEvent.kibana.host).to.be('my-host');
    expect(mappedEvent.kibana.name).to.be('kibana123');
    expect(mappedEvent.kibana.transport_address).to.be('myhost:7890');
    expect(mappedEvent.kibana.uuid).to.be('xyz123');
    expect(mappedEvent.kibana.version).to.be('1.2.3');
    expect(mappedEvent.kibana.snapshot).to.be(false);
    expect(mappedEvent.kibana.status).to.be('mocked');

    // rollup should be completely included as-is in the mapped event
    _.forIn(lastOp.rollup, (value, key) => {
      expect(mappedEvent[key]).to.be(value);
    });
  });

  it('mapEvent properly recognizes snapshots', () => {
    const config = getMockConfig();
    const serverInfo = getMockServerInfo();

    // expected case
    serverInfo.version = '2.3.4-SNAPSHOT';
    const mappedEvent1 = mapEvent(lastOp, config, serverInfo);

    expect(mappedEvent1.kibana.version).to.be('2.3.4');
    expect(mappedEvent1.kibana.snapshot).to.be(true);

    // case insensitive
    serverInfo.version = '3.4.5-snapshot';
    const mappedEvent2 = mapEvent(lastOp, config, serverInfo);

    expect(mappedEvent2.kibana.version).to.be('3.4.5');
    expect(mappedEvent2.kibana.snapshot).to.be(true);

    // not a snapshot (tested above, but reconfirmed here)
    serverInfo.version = '4.5.6';
    const mappedEvent3 = mapEvent(lastOp, config, serverInfo);

    expect(mappedEvent3.kibana.version).to.be('4.5.6');
    expect(mappedEvent3.kibana.snapshot).to.be(false);
  });
});
