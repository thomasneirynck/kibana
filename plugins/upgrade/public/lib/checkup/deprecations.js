import _ from 'lodash';
import {
  getFromApi,
} from '../request';

const issueSeverity = {
  'critical': 1,
  'warning': 2,
  'info': 3,
  'none': 4,
};

const issueInfoForSeverity = {
  'critical': 'This issue must be resolved to upgrade.',
  'warning': 'It is advised to resolve this issue, but it is not required to upgrade.',
  'info': 'No action required, but it is advised to read about the change.',
  'none': '',
};

export async function getDeprecations() {
  const deprecations = await getFromApi(`/api/migration/deprecations`);
  const { index_settings } = deprecations;

  const assistanceResponse = await getFromApi(`/api/migration/assistance`);
  const assistanceIndices = Object.keys(assistanceResponse);

  const indexDeprecations = ensureReindexDeprecations(index_settings, assistanceIndices);
  const sortedIndexDeprecations = _.mapValues(indexDeprecations, sortDeprecations);

  const newDeprecations = {
    index_settings: sortedIndexDeprecations,
    node_settings: sortDeprecations(deprecations.node_settings),
    cluster_settings: sortDeprecations(deprecations.cluster_settings),
  };

  return {
    index_settings: _.mapValues(newDeprecations.index_settings, list => _.map(list, appendIssueInfoToDeprecation)),
    node_settings: _.map(newDeprecations.node_settings, appendIssueInfoToDeprecation),
    cluster_settings: _.map(newDeprecations.cluster_settings, appendIssueInfoToDeprecation),
  };
}

function ensureReindexDeprecations(deprecationsByIndex, indicesToAppend) {
  // remove any reindex deprecations
  const filteredDeprecationsByIndex = _.mapValues(deprecationsByIndex, deprecations => (
    _.reject(deprecations, isReindexDeprecation)
  ));

  // append reindex deprecations for all indices in indicesToAppend
  return _.reduce(indicesToAppend, (acc, indexName) => {
    return {
      ...acc,
      [indexName]: [
        ...(acc[indexName] || []),
        createReindexDeprecation(),
      ],
    };
  }, filteredDeprecationsByIndex);
}

function appendIssueInfoToDeprecation(depr) {
  return {
    ...depr,
    issueInfo: issueInfoForSeverity[depr.level],
  };
}

function sortDeprecations(deprs) {
  return _.sortBy(deprs, d => issueSeverity[d.level]);
}

function createReindexDeprecation() {
  return {
    details: '',
    level: 'critical',
    message: `This index must be reindexed in order to upgrade the Elastic stack. You may use the Reindex Helper in the next tab to \
      perform the reindex. Reindexing is irreversible, so always back up your index before proceeding.`,
    url: 'https://www.elastic.co/guide/en/elasticsearch/reference/6.0/breaking-changes-6.0.html#_indices_created_before_6_0',
  };
}

function isReindexDeprecation(d) {
  return d.level === 'critical' &&
    d.message.includes('Index created before') &&
    d.url.includes('_indices_created_before_');
}
