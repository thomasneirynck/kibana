export default function ({ loadTestFile }) {
  describe('elasticsearch', () => {
    loadTestFile(require.resolve('./nodes-listing'));
  });
}
