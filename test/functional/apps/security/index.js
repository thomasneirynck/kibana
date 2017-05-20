export default function ({ loadTestFile }) {
  describe('security app', function () {
    loadTestFile(require.resolve('./security'));
    loadTestFile(require.resolve('./management'));
    loadTestFile(require.resolve('./users'));
  });
}
