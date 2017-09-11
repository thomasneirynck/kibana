export default function ({ loadTestFile }) {
  describe('graph app', function () {
    loadTestFile(require.resolve('./graph'));
  });
}
