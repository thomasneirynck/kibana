export default function ({ loadTestFile }) {
  describe('logstash', () => {
    loadTestFile(require.resolve('./pipeline_list'));
    loadTestFile(require.resolve('./pipeline_create'));
  });
}
