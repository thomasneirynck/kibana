export default function ({ loadTestFile }) {
  describe('dashboard mode', function () {
    loadTestFile(require.resolve('./dashboard_view_mode'));
  });
}
