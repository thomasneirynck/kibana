/*eslint-disable max-len*/
import expect from 'expect.js';
import clusterDataFixture from './fixtures/cluster_data';
import { handleResponse } from '../handle_response';

const { nodeStats, clusterStats, shardStats, timeOptions } = clusterDataFixture;
describe('map response of nodes data', () => {
  it('handles empty parameters', () => {
    const result = handleResponse();
    expect(result).to.eql([]);
  });

  it('handles empty clusterStats', () => {
    const result = handleResponse(
      nodeStats,
      undefined,
      shardStats,
      timeOptions
    );
    const expected = [
      {
        name: 'hello01',
        transport_address: '127.0.0.1:9300',
        type: 'node',
        isOnline: false,
        nodeTypeLabel: 'Node',
        nodeTypeClass: 'fa-server',
        shardCount: 6,
        resolver: '_x_V2YzPQU-a9KRRBxUxZQ'
      },
      {
        name: 'hello02',
        transport_address: '127.0.0.1:9301',
        type: 'node',
        isOnline: false,
        nodeTypeLabel: 'Node',
        nodeTypeClass: 'fa-server',
        shardCount: 6,
        resolver: 'DAiX7fFjS3Wii7g2HYKrOg'
      }
    ];
    expect(result).to.eql(expected);
  });

  it('handles empty shardStats', () => {
    const result = handleResponse(
      nodeStats,
      clusterStats,
      undefined,
      timeOptions
    );
    const expected = [
      {
        name: 'hello01',
        transport_address: '127.0.0.1:9300',
        type: 'master',
        isOnline: true,
        nodeTypeLabel: 'Master Node',
        nodeTypeClass: 'fa-star',
        shardCount: null,
        node_cgroup_quota: { metric: { app: 'elasticsearch', field: 'node_stats.process.cpu.percent', metricAgg: 'max', label: 'Cgroup CPU Utilization', title: 'CPU Utilization', description: 'CPU Usage time compared to the CPU quota shown in percentage. If CPU quotas are not set, then no data will be shown.', units: '%', format: '0,0.[00]', hasCalculation: true, isDerivative: false }, summary: { minVal: 11.0291808, maxVal: 41.9489639, lastVal: 37.38913345, slope: 1 } },
        node_cgroup_throttled: { metric: { app: 'elasticsearch', field: 'node_stats.os.cgroup.cpu.stat.time_throttled_nanos', metricAgg: 'max', label: 'Cgroup Throttling', title: 'Cgroup CPU Performance', description: 'The amount of throttled time, reported in nanoseconds, of the Cgroup.', units: 'ns', format: '0,0.[0]a', hasCalculation: false, isDerivative: true }, summary: { minVal: 0, maxVal: 30063709491, lastVal: 123012140, slope: -1 } },
        node_cpu_utilization: { metric: { app: 'elasticsearch', field: 'node_stats.process.cpu.percent', metricAgg: 'max', label: 'CPU Utilization', description: 'Percentage of CPU usage for the Elasticsearch process.', units: '%', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 1, maxVal: 4, lastVal: 3, slope: 1 } },
        node_load_average: { metric: { app: 'elasticsearch', field: 'node_stats.os.cpu.load_average.1m', metricAgg: 'max', label: '1m', title: 'System Load', description: 'Load average over the last minute.', units: '', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 1.0400390625, maxVal: 2.439453125, lastVal: 1.0400390625, slope: -1 } },
        node_jvm_mem_percent: { metric: { app: 'elasticsearch', field: 'node_stats.jvm.mem.heap_used_percent', metricAgg: 'max', label: 'Used Heap', title: 'JVM Heap', description: 'Total heap used by Elasticsearch running in the JVM.', units: '%', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 25, maxVal: 52, lastVal: 40, slope: -1 } },
        node_free_space: { metric: { app: 'elasticsearch', field: 'node_stats.fs.total.available_in_bytes', metricAgg: 'max', label: 'Disk Free Space', description: 'Free disk space available on the node.', units: '', format: '0.0 b', hasCalculation: false, isDerivative: false }, summary: { minVal: 3141324800, maxVal: 3195629568, lastVal: 3141324800, slope: -1 } },
        resolver: '_x_V2YzPQU-a9KRRBxUxZQ'
      },
      {
        name: 'hello02',
        transport_address: '127.0.0.1:9301',
        type: 'node',
        isOnline: true,
        nodeTypeLabel: 'Node',
        nodeTypeClass: 'fa-server',
        shardCount: null,
        node_cgroup_quota: undefined,
        node_cgroup_throttled: { metric: { app: 'elasticsearch', field: 'node_stats.os.cgroup.cpu.stat.time_throttled_nanos', metricAgg: 'max', label: 'Cgroup Throttling', title: 'Cgroup CPU Performance', description: 'The amount of throttled time, reported in nanoseconds, of the Cgroup.', units: 'ns', format: '0,0.[0]a', hasCalculation: false, isDerivative: true }, summary: { minVal: 0, maxVal: 0, lastVal: 0, slope: -1 } },
        node_cpu_utilization: { metric: { app: 'elasticsearch', field: 'node_stats.process.cpu.percent', metricAgg: 'max', label: 'CPU Utilization', description: 'Percentage of CPU usage for the Elasticsearch process.', units: '%', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 0, maxVal: 8, lastVal: 0, slope: -1 } },
        node_load_average: { metric: { app: 'elasticsearch', field: 'node_stats.os.cpu.load_average.1m', metricAgg: 'max', label: '1m', title: 'System Load', description: 'Load average over the last minute.', units: '', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 1.0400390625, maxVal: 2.439453125, lastVal: 1.0400390625, slope: -1 } },
        node_jvm_mem_percent: { metric: { app: 'elasticsearch', field: 'node_stats.jvm.mem.heap_used_percent', metricAgg: 'max', label: 'Used Heap', title: 'JVM Heap', description: 'Total heap used by Elasticsearch running in the JVM.', units: '%', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 22, maxVal: 43, lastVal: 41, slope: 1 } },
        node_free_space: { metric: { app: 'elasticsearch', field: 'node_stats.fs.total.available_in_bytes', metricAgg: 'max', label: 'Disk Free Space', description: 'Free disk space available on the node.', units: '', format: '0.0 b', hasCalculation: false, isDerivative: false }, summary: { minVal: 3141402624, maxVal: 3148406784, lastVal: 3141402624, slope: -1 } },
        resolver: 'DAiX7fFjS3Wii7g2HYKrOg'
      }
    ];
    expect(result).to.eql(expected);
  });

  it('handles empty time options', () => {
    const result = handleResponse(
      nodeStats,
      clusterStats,
      shardStats,
      undefined
    );
    const expected = [
      {
        name: 'hello01',
        transport_address: '127.0.0.1:9300',
        type: 'master',
        isOnline: true,
        nodeTypeLabel: 'Master Node',
        nodeTypeClass: 'fa-star',
        shardCount: 6,
        node_cgroup_quota: null,
        node_cgroup_throttled: null,
        node_cpu_utilization: null,
        node_load_average: null,
        node_jvm_mem_percent: null,
        node_free_space: null,
        resolver: '_x_V2YzPQU-a9KRRBxUxZQ'
      },
      {
        name: 'hello02',
        transport_address: '127.0.0.1:9301',
        type: 'node',
        isOnline: true,
        nodeTypeLabel: 'Node',
        nodeTypeClass: 'fa-server',
        shardCount: 6,
        node_cgroup_quota: null,
        node_cgroup_throttled: null,
        node_cpu_utilization: null,
        node_load_average: null,
        node_jvm_mem_percent: null,
        node_free_space: null,
        resolver: 'DAiX7fFjS3Wii7g2HYKrOg'
      }
    ];

    expect(result).to.eql(expected);
  });

  it('summarizes response data, with cgroup metrics', () => {
    const result = handleResponse(
      nodeStats,
      clusterStats,
      shardStats,
      timeOptions
    );
    const expected = [
      {
        name: 'hello01',
        transport_address: '127.0.0.1:9300',
        type: 'master',
        isOnline: true,
        nodeTypeLabel: 'Master Node',
        nodeTypeClass: 'fa-star',
        shardCount: 6,
        node_cgroup_quota: { metric: { app: 'elasticsearch', field: 'node_stats.process.cpu.percent', metricAgg: 'max', label: 'Cgroup CPU Utilization', title: 'CPU Utilization', description: 'CPU Usage time compared to the CPU quota shown in percentage. If CPU quotas are not set, then no data will be shown.', units: '%', format: '0,0.[00]', hasCalculation: true, isDerivative: false }, summary: { minVal: 11.0291808, maxVal: 41.9489639, lastVal: 37.38913345, slope: 1 } },
        node_cgroup_throttled: { metric: { app: 'elasticsearch', field: 'node_stats.os.cgroup.cpu.stat.time_throttled_nanos', metricAgg: 'max', label: 'Cgroup Throttling', title: 'Cgroup CPU Performance', description: 'The amount of throttled time, reported in nanoseconds, of the Cgroup.', units: 'ns', format: '0,0.[0]a', hasCalculation: false, isDerivative: true }, summary: { minVal: 0, maxVal: 30063709491, lastVal: 123012140, slope: -1 } },
        node_cpu_utilization: { metric: { app: 'elasticsearch', field: 'node_stats.process.cpu.percent', metricAgg: 'max', label: 'CPU Utilization', description: 'Percentage of CPU usage for the Elasticsearch process.', units: '%', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 1, maxVal: 4, lastVal: 3, slope: 1 } },
        node_load_average: { metric: { app: 'elasticsearch', field: 'node_stats.os.cpu.load_average.1m', metricAgg: 'max', label: '1m', title: 'System Load', description: 'Load average over the last minute.', units: '', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 1.0400390625, maxVal: 2.439453125, lastVal: 1.0400390625, slope: -1 } },
        node_jvm_mem_percent: { metric: { app: 'elasticsearch', field: 'node_stats.jvm.mem.heap_used_percent', metricAgg: 'max', label: 'Used Heap', title: 'JVM Heap', description: 'Total heap used by Elasticsearch running in the JVM.', units: '%', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 25, maxVal: 52, lastVal: 40, slope: -1 } },
        node_free_space: { metric: { app: 'elasticsearch', field: 'node_stats.fs.total.available_in_bytes', metricAgg: 'max', label: 'Disk Free Space', description: 'Free disk space available on the node.', units: '', format: '0.0 b', hasCalculation: false, isDerivative: false }, summary: { minVal: 3141324800, maxVal: 3195629568, lastVal: 3141324800, slope: -1 } },
        resolver: '_x_V2YzPQU-a9KRRBxUxZQ'
      },
      {
        name: 'hello02',
        transport_address: '127.0.0.1:9301',
        type: 'node',
        isOnline: true,
        nodeTypeLabel: 'Node',
        nodeTypeClass: 'fa-server',
        shardCount: 6,
        node_cgroup_quota: undefined,
        node_cgroup_throttled: { metric: { app: 'elasticsearch', field: 'node_stats.os.cgroup.cpu.stat.time_throttled_nanos', metricAgg: 'max', label: 'Cgroup Throttling', title: 'Cgroup CPU Performance', description: 'The amount of throttled time, reported in nanoseconds, of the Cgroup.', units: 'ns', format: '0,0.[0]a', hasCalculation: false, isDerivative: true }, summary: { minVal: 0, maxVal: 0, lastVal: 0, slope: -1 } },
        node_cpu_utilization: { metric: { app: 'elasticsearch', field: 'node_stats.process.cpu.percent', metricAgg: 'max', label: 'CPU Utilization', description: 'Percentage of CPU usage for the Elasticsearch process.', units: '%', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 0, maxVal: 8, lastVal: 0, slope: -1 } },
        node_load_average: { metric: { app: 'elasticsearch', field: 'node_stats.os.cpu.load_average.1m', metricAgg: 'max', label: '1m', title: 'System Load', description: 'Load average over the last minute.', units: '', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 1.0400390625, maxVal: 2.439453125, lastVal: 1.0400390625, slope: -1 } },
        node_jvm_mem_percent: { metric: { app: 'elasticsearch', field: 'node_stats.jvm.mem.heap_used_percent', metricAgg: 'max', label: 'Used Heap', title: 'JVM Heap', description: 'Total heap used by Elasticsearch running in the JVM.', units: '%', format: '0,0.[00]', hasCalculation: false, isDerivative: false }, summary: { minVal: 22, maxVal: 43, lastVal: 41, slope: 1 } },
        node_free_space: { metric: { app: 'elasticsearch', field: 'node_stats.fs.total.available_in_bytes', metricAgg: 'max', label: 'Disk Free Space', description: 'Free disk space available on the node.', units: '', format: '0.0 b', hasCalculation: false, isDerivative: false }, summary: { minVal: 3141402624, maxVal: 3148406784, lastVal: 3141402624, slope: -1 } },
        resolver: 'DAiX7fFjS3Wii7g2HYKrOg'
      }
    ];
    expect(result).to.eql(expected);
  });
});
