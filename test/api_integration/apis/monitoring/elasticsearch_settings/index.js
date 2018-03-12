export default function ({ loadTestFile }) {
  describe('elasticsearch_settings', () => {
    loadTestFile(require.resolve('./check_cluster'));
    loadTestFile(require.resolve('./check_nodes'));
    loadTestFile(require.resolve('./set_collection_enabled'));
    loadTestFile(require.resolve('./set_collection_interval'));
  });
}
