export default function ({ loadTestFile }) {
  describe('apis', () => {
    loadTestFile(require.resolve('./security'));
  });
}
