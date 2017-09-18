import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const random = getService('random');
  const kibanaServer = getService('kibanaServer');
  const pipelineList = getService('pipelineList');
  const pipelineEditor = getService('pipelineEditor');
  const PageObjects = getPageObjects(['logstash']);

  describe('pipeline create new', () => {
    before(async () => {
      await esArchiver.load('logstash/empty');
      await kibanaServer.waitForStabilization();
    });

    after(async () => {
      await esArchiver.unload('logstash/empty');
    });

    it('starts with the default values', async () => {
      await PageObjects.logstash.gotoNewPipelineEditor();
      await pipelineEditor.assertDefaultInputs();
    });

    describe('save button', () => {
      it('creates the pipeline and redirects to the list', async () => {
        await PageObjects.logstash.gotoNewPipelineEditor();

        const id = random.id();
        const description = random.text();
        const pipeline = random.longText();

        await pipelineEditor.setId(id);
        await pipelineEditor.setDescription(description);
        await pipelineEditor.setPipeline(pipeline);

        await pipelineEditor.assertInputs({
          id, description, pipeline
        });

        await pipelineEditor.clickSave();
        await pipelineList.assertExists();
        const rows = await pipelineList.getRowsFromTable();
        const newRow = rows.find(row => row.id === id);

        expect(newRow)
          .to.have.property('description', description);
      });
    });

    describe('cancel button', () => {
      it('discards the pipeline and redirects to the list', async () => {
        await PageObjects.logstash.gotoPipelineList();
        const originalRows = await pipelineList.getRowsFromTable();

        await PageObjects.logstash.gotoNewPipelineEditor();
        await pipelineEditor.clickCancel();

        await pipelineList.assertExists();
        const currentRows = await pipelineList.getRowsFromTable();
        expect(originalRows).to.eql(currentRows);
      });
    });

    describe('delete button', () => {
      it('is not visible', async () => {
        await PageObjects.logstash.gotoNewPipelineEditor();
        await pipelineEditor.assertNoDeleteButton();
      });
    });
  });
}
