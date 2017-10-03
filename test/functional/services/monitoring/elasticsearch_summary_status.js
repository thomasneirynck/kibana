export function MonitoringElasticsearchSummaryStatusProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_SUMMARY = 'elasticsearchSummaryStatus';
  const SUBJ_SUMMARY_NODES_COUNT = `${SUBJ_SUMMARY} nodesCount`;
  const SUBJ_SUMMARY_INDICES_COUNT = `${SUBJ_SUMMARY} indicesCount`;
  const SUBJ_SUMMARY_MEMORY = `${SUBJ_SUMMARY} memory`;
  const SUBJ_SUMMARY_TOTAL_SHARDS = `${SUBJ_SUMMARY} totalShards`;
  const SUBJ_SUMMARY_UNASSIGNED_SHARDS = `${SUBJ_SUMMARY} unassignedShards`;
  const SUBJ_SUMMARY_DOCUMENT_COUNT = `${SUBJ_SUMMARY} documentCount`;
  const SUBJ_SUMMARY_DATA_SIZE = `${SUBJ_SUMMARY} dataSize`;

  return new class ElasticsearchSummaryStatus {

    async getContent() {
      return {
        nodesCount: await testSubjects.getVisibleText(SUBJ_SUMMARY_NODES_COUNT),
        indicesCount: await testSubjects.getVisibleText(SUBJ_SUMMARY_INDICES_COUNT),
        memory: await testSubjects.getVisibleText(SUBJ_SUMMARY_MEMORY),
        totalShards: await testSubjects.getVisibleText(SUBJ_SUMMARY_TOTAL_SHARDS),
        unassignedShards: await testSubjects.getVisibleText(SUBJ_SUMMARY_UNASSIGNED_SHARDS),
        documentCount: await testSubjects.getVisibleText(SUBJ_SUMMARY_DOCUMENT_COUNT),
        dataSize: await testSubjects.getVisibleText(SUBJ_SUMMARY_DATA_SIZE),
      };
    }

  };
}
