export default function ({ loadTestFile }) {
  describe('reporting', () => {
    loadTestFile(require.resolve('./generate_pdf'));
  });
}
