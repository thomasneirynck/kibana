export default function ({ loadTestFile }) {
  describe('telemetry', () => {
    loadTestFile(require.resolve('./telemetry'));
  });
}
