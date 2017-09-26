export function GrokDebuggerPageProvider({ getPageObjects, getService }) {
  const PageObjects = getPageObjects(['common']);
  const grokDebugger = getService('grokDebugger');

  return new class LogstashPage {
    async gotoGrokDebugger() {
      await PageObjects.common.navigateToApp('grokDebugger');
      await grokDebugger.assertExists();
    }
  };
}
