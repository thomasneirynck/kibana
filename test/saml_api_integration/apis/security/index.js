export default function ({ loadTestFile }) {
  describe('security', () => {
    loadTestFile(require.resolve('./saml_login'));
  });
}
