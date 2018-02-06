export default function ({ loadTestFile }) {
  describe('monitoring', () => {
    loadTestFile(require.resolve('./cluster'));
    loadTestFile(require.resolve('./telemetry'));
  });
}
