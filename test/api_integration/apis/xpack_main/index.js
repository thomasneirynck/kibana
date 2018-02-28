export default function ({ loadTestFile }) {
  describe('xpack_main', () => {
    loadTestFile(require.resolve('./telemetry'));
  });
}
