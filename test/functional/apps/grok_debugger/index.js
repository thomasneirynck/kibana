export default function ({ loadTestFile }) {
  describe('logstash', () => {
    loadTestFile(require.resolve('./grok_debugger'));
  });
}
