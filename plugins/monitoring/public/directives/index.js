define(function (require) {
  require('plugins/monitoring/directives/main/index');
  require('plugins/monitoring/directives/cluster_status/index');
  require('plugins/monitoring/directives/chart/index');
  require('plugins/monitoring/directives/shard_activity/index');
  require('plugins/monitoring/directives/index_listing/index');
  require('plugins/monitoring/directives/node_listing/index');
  require('plugins/monitoring/directives/kibana_listing/index');
  require('plugins/monitoring/directives/cluster_listing/cluster_listing_directive.jsx');
  require('plugins/monitoring/directives/node_summary/index');
  require('plugins/monitoring/directives/index_summary/index');
  require('plugins/monitoring/directives/welcome_msg/index');
  require('plugins/monitoring/directives/google_analytics/index');
  require('plugins/monitoring/directives/shard_allocation/index');
});
