export default function ({ loadTestFile }) {
  describe('reporting app', function () {
    loadTestFile(require.resolve('./reporting'));
  });
}
