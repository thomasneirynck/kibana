export default function ({ loadTestFile }) {
  describe('monitoring', () => {
    loadTestFile(require.resolve('./cluster'));
    loadTestFile(require.resolve('./beats'));
    loadTestFile(require.resolve('./telemetry'));
  });
}
