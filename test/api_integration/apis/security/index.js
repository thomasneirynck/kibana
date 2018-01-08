export default function ({ loadTestFile }) {
  describe('security', () => {
    loadTestFile(require.resolve('./basic-login'));
  });
}
