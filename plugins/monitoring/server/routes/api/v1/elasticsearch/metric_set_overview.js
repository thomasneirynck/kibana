export const metricSet = [
  'cluster_search_request_rate',
  'cluster_query_latency',
  {
    keys: [
      'cluster_index_request_rate_total',
      'cluster_index_request_rate_primary'
    ],
    name: 'cluster_index_request_rate'
  },
  'cluster_index_latency'
];
