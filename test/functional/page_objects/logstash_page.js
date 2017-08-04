export function LogstashPageProvider({ getPageObjects, getService }) {
  const PageObjects = getPageObjects(['common']);
  const pipelineList = getService('pipelineList');
  const pipelineEditor = getService('pipelineEditor');

  return new class LogstashPage {
    async gotoPipelineList() {
      await PageObjects.common.navigateToApp('logstashPipelines');
      await pipelineList.assertExists();
    }

    async gotoNewPipelineEditor() {
      await this.gotoPipelineList();
      await pipelineList.clickAdd();
      await pipelineEditor.assertExists();
    }
  };
}
