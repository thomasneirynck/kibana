import expect from 'expect.js';
import { props as propsAsync } from 'bluebird';

export function PipelineEditorProvider({ getService }) {
  const aceEditor = getService('aceEditor');
  const testSubjects = getService('testSubjects');

  // test subject selectors
  const SUBJ_CONTAINER = 'pipelineEdit';
  const getContainerSubjForId = id => `pipelineEdit-${id}`;
  const SUBJ_INPUT_ID = 'pipelineEdit inputId';
  const SUBJ_INPUT_DESCRIPTION = 'pipelineEdit inputDescription';
  const SUBJ_UI_ACE_PIPELINE = 'pipelineEdit acePipeline';
  const SUBJ_BTN_SAVE = 'pipelineEdit btnSavePipeline';
  const SUBJ_BTN_CANCEL = 'pipelineEdit btnCancel';
  const SUBJ_BTN_DELETE = 'pipelineEdit btnDeletePipeline';

  const DEFAULT_INPUT_VALUES = {
    id: '',
    description: '',
    pipeline: [
      'input {',
      '}',
      'filter {',
      '}',
      'output {',
      '}',
    ].join('\n')
  };

  return new class PipelineEditor {
    async clickSave() {
      await testSubjects.click(SUBJ_BTN_SAVE);
    }
    async clickCancel() {
      await testSubjects.click(SUBJ_BTN_CANCEL);
    }
    async clickDelete() {
      await testSubjects.click(SUBJ_BTN_DELETE);
    }

    async setId(value) {
      await testSubjects.setValue(SUBJ_INPUT_ID, value);
    }
    async setDescription(value) {
      await testSubjects.setValue(SUBJ_INPUT_DESCRIPTION, value);
    }
    async setPipeline(value) {
      await aceEditor.setValue(SUBJ_UI_ACE_PIPELINE, value);
    }

    /**
     *  Assert that the editor is visible on the page and
     *  throw a meaningful error if not
     *  @return {Promise<undefined>}
     */
    async assertExists() {
      if (!await testSubjects.exists(SUBJ_CONTAINER)) {
        throw new Error('Expected to find the pipeline editor');
      }
    }

    /**
     *  Assert that the editor is visible on the page and is
     *  working on a specific id
     *  @param  {string} id
     *  @return {Promise<undefined>}
     */
    async assertEditorId(id) {
      if (!await testSubjects.exists(getContainerSubjForId(id))) {
        throw new Error(`Expected editor id to be "${id}"`);
      }
    }

    /**
     *  Assert that the editors fields match the defaults
     *  @return {Promise<undefined>}
     */
    async assertDefaultInputs() {
      await this.assertInputs(DEFAULT_INPUT_VALUES);
    }

    /**
     *  Assert that the editors fields match the passed values
     *  @param  {Object} expectedValues - must have id, description, and pipeline keys
     *  @return {Promise<undefined>}
     */
    async assertInputs(expectedValues) {
      const values = await propsAsync({
        id: testSubjects.getProperty(SUBJ_INPUT_ID, 'value'),
        description: testSubjects.getProperty(SUBJ_INPUT_DESCRIPTION, 'value'),
        pipeline: aceEditor.getValue(SUBJ_UI_ACE_PIPELINE),
      });

      expect(values).to.eql(expectedValues);
    }

    async assertNoDeleteButton() {
      if (await testSubjects.exists(SUBJ_BTN_DELETE)) {
        throw new Error('Expected there to be no delete button');
      }
    }
  };
}
