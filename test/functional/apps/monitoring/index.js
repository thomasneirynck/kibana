export default function ({ loadTestFile }) {
  describe('monitoring', () => {
    loadTestFile(require.resolve('./cluster/list'));
    loadTestFile(require.resolve('./cluster/overview'));
    loadTestFile(require.resolve('./cluster/alerts'));
    // loadTestFile(require.resolve('./cluster/license'));

    // loadTestFile(require.resolve('./elasticsearch/overview'));
    // loadTestFile(require.resolve('./elasticsearch/nodes'));
    loadTestFile(require.resolve('./elasticsearch/node_detail'));
    loadTestFile(require.resolve('./elasticsearch/indices'));
    loadTestFile(require.resolve('./elasticsearch/index_detail'));
    loadTestFile(require.resolve('./elasticsearch/shards'));
    // loadTestFile(require.resolve('./elasticsearch/shard_activity'));

    // loadTestFile(require.resolve('./kibana/overview'));
    // loadTestFile(require.resolve('./kibana/instances'));
    // loadTestFile(require.resolve('./kibana/instance'));

    // loadTestFile(require.resolve('./logstash/overview'));
    // loadTestFile(require.resolve('./logstash/nodes'));
    // loadTestFile(require.resolve('./logstash/node'));

    // loadTestFile(require.resolve('./logstash/pipelines'));
  });
}
