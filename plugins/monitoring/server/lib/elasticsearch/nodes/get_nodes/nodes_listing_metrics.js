// "listing metrics" is an array of metric objects from metrics/metrics.js
// used for getting some time series data to add to the response
export const LISTING_METRICS_NAMES = [
  'node_cgroup_quota',
  'node_cgroup_throttled',
  'node_cpu_utilization',
  'node_load_average',
  'node_jvm_mem_percent',
  'node_free_space'
];

export const LISTING_METRICS_PATHS = [
  'aggregations.nodes.buckets.node_cgroup_quota.buckets',
  'aggregations.nodes.buckets.node_cgroup_throttled.buckets',
  'aggregations.nodes.buckets.node_cpu_utilization.buckets',
  'aggregations.nodes.buckets.node_load_average.buckets',
  'aggregations.nodes.buckets.node_jvm_mem_percent.buckets',
  'aggregations.nodes.buckets.node_free_space.buckets',
];
