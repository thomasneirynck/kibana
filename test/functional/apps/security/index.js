export default function ({ loadTestFile }) {
  describe('security app', function () {
    loadTestFile(require.resolve('./security'));
    loadTestFile(require.resolve('./doc_level_security_roles'));
    loadTestFile(require.resolve('./management'));
    loadTestFile(require.resolve('./users'));
    loadTestFile(require.resolve('./secure_roles_perm'));
  });
}
