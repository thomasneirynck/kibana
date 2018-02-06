export default function ({ loadTestFile }) {
  describe('cluster', () => {
    loadTestFile(require.resolve('./list'));
    loadTestFile(require.resolve('./overview'));
  });
}
