export default function ({ loadTestFile }) {
  describe('watcher app', function () {
    //loadTestFile(require.resolve('./management'));
    loadTestFile(require.resolve('./watcher_test'));
  });
}
