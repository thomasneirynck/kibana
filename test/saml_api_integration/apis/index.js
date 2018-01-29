export default function ({ loadTestFile }) {
  describe('apis SAML', () => {
    loadTestFile(require.resolve('./security'));
  });
}
