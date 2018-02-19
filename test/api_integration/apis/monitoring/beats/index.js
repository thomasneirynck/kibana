export default function ({ loadTestFile }) {
  describe('beats', () => {
    loadTestFile(require.resolve('./list'));
  });
}
