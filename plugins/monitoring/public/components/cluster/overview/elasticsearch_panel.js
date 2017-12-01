import React from 'react';
import { get, capitalize } from 'lodash';
import { formatNumber } from 'plugins/monitoring/lib/format_number';
import { KuiKeyboardAccessible } from 'ui_framework/components';
import { ElasticsearchStatusIcon } from 'plugins/monitoring/components/elasticsearch/status_icon';
import { ClusterItemContainer, HealthStatusIndicator, BytesUsage, BytesPercentageUsage } from './helpers';

const calculateShards = shards => {
  const total = get(shards, 'total', 0);
  let primaries = get(shards, 'primaries', 'N/A');
  let replicas = 'N/A';

  // we subtract primaries from total to get replica count, so if we don't know primaries, then
  //  we cannot know replicas (because we'd be showing the wrong number!)
  if (primaries !== 'N/A') {
    replicas = formatNumber(total - primaries, 'int_commas');
    primaries = formatNumber(primaries, 'int_commas');
  }

  return {
    primaries,
    replicas
  };
};

export function ElasticsearchPanel(props) {

  const clusterStats = props.cluster_stats || {};
  const nodes = clusterStats.nodes;
  const indices = clusterStats.indices;

  const goToElasticsearch = () => props.changeUrl('elasticsearch');
  const goToNodes = () => props.changeUrl('elasticsearch/nodes');
  const goToIndices = () => props.changeUrl('elasticsearch/indices');

  const { primaries, replicas } = calculateShards(get(props, 'cluster_stats.indices.shards', {}));

  const statusIndicator = (
    <HealthStatusIndicator>
      <ElasticsearchStatusIcon status={clusterStats.status} />&nbsp;
      { capitalize(clusterStats.status) }
    </HealthStatusIndicator>
  );

  const showMlJobs = () => {
    // if license doesn't support ML, then `ml === null`
    if (props.ml) {
      return <dd data-test-subj="esMlJobs">Jobs: { props.ml.jobs }</dd>;
    }
    return null;
  };

  return (
    <ClusterItemContainer {...props} statusIndicator={statusIndicator} url="elasticsearch" title="Elasticsearch">
      <div className="row">
        <div className="col-md-4">
          <dl>
            <dt className="cluster-panel__inner-title">
              <KuiKeyboardAccessible>
                <a className="kuiLink" onClick={goToElasticsearch} aria-label="Elasticsearch Overview">
                  Overview
                </a>
              </KuiKeyboardAccessible>
            </dt>
            <dd data-test-subj="esVersion">Version: { get(nodes, 'versions[0]') || 'N/A' }</dd>
            <dd data-test-subj="esUptime">Uptime: { formatNumber(get(nodes, 'jvm.max_uptime_in_millis'), 'time_since') }</dd>
            {showMlJobs()}
          </dl>
        </div>
        <div className="col-md-4">
          <dl>
            <dt className="cluster-panel__inner-title">
              <KuiKeyboardAccessible>
                <a
                  className="kuiLink"
                  onClick={goToNodes}
                  data-test-subj="esNumberOfNodes"
                  aria-label={`Elasticsearch Nodes: ${ formatNumber(get(nodes, 'count.total'), 'int_commas') }`}
                >
                  Nodes: { formatNumber(get(nodes, 'count.total'), 'int_commas') }
                </a>
              </KuiKeyboardAccessible>
            </dt>
            <dd data-test-subj="esDiskAvailable">
              Disk Available: <BytesUsage
                usedBytes={get(nodes, 'fs.available_in_bytes')}
                maxBytes={get(nodes, 'fs.total_in_bytes')}
              />
            </dd>
            <dd data-test-subj="esJvmHeap">
              JVM Heap: <BytesPercentageUsage
                usedBytes={get(nodes, 'jvm.mem.heap_used_in_bytes')}
                maxBytes={get(nodes, 'jvm.mem.heap_max_in_bytes')}
              />
            </dd>
          </dl>
        </div>
        <div className="col-md-4">
          <dl>
            <dt className="cluster-panel__inner-title">
              <KuiKeyboardAccessible>
                <a
                  className="kuiLink"
                  onClick={goToIndices}
                  data-test-subj="esNumberOfIndices"
                  aria-label={`Elasticsearch Indices: ${ formatNumber(get(indices, 'count'), 'int_commas') }`}
                >
                  Indices: { formatNumber(get(indices, 'count'), 'int_commas') }
                </a>
              </KuiKeyboardAccessible>
            </dt>
            <dd data-test-subj="esDocumentsCount">Documents: { formatNumber(get(indices, 'docs.count'), 'int_commas') }</dd>
            <dd data-test-subj="esDiskUsage">Disk Usage: { formatNumber(get(indices, 'store.size_in_bytes'), 'bytes') }</dd>
            <dd data-test-subj="esPrimaryShards">Primary Shards: { primaries }</dd>
            <dd data-test-subj="esReplicaShards">Replica Shards: { replicas }</dd>
          </dl>
        </div>
      </div>
    </ClusterItemContainer>
  );
}
