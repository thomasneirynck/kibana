export default function ({ loadTestFile }) {
  describe('monitoring', () => {
    loadTestFile(require.resolve('./elasticsearch'));
    loadTestFile(require.resolve('./cluster'));
    loadTestFile(require.resolve('./elasticsearch_settings'));
    loadTestFile(require.resolve('./beats'));
  });
}
