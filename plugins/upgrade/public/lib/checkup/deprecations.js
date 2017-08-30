import _ from 'lodash';
import {
  getFromApi,
} from '../request';

const issueSeverity = {
  'critical': 1,
  'warning': 2,
  'info': 3,
};

export async function getDeprecations() {
  const deprecations = await getFromApi(`/api/migration/deprecations`);
  const { index_settings } = deprecations;

  const assistanceResponse = await getFromApi(`/api/migration/assistance`);
  const assistanceIndices = Object.keys(assistanceResponse);

  const indexDeprecations = ensureReindexDeprecations(index_settings, assistanceIndices);
  const sortedIndexDeprecations = _.mapValues(indexDeprecations, sortDeprecations);

  return {
    index_settings: sortedIndexDeprecations,
    node_settings: sortDeprecations(deprecations.node_settings),
    cluster_settings: sortDeprecations(deprecations.cluster_settings),
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

function sortDeprecations(deprs) {
  return _.sortBy(deprs, d => {
    return issueSeverity[d.level];
  });
}

function createReindexDeprecation() {
  return {
    details: '',
    level: 'critical',
    message: `This index must be reindexed in order to upgrade the Elastic stack. You may use the Reindex Helper in the next tab to \
      perform the reindex, or delete the index if you are sure that you don\'t need it. Reindexing and deletion are irreversible, so \
      always back up your index before proceeding.`,
    url: 'https://www.elastic.co/guide/en/elasticsearch/reference/6.0/breaking-changes-6.0.html#_indices_created_before_6_0',
  };
}

function isReindexDeprecation(d) {
  return d.level === 'critical' &&
    d.message.includes('Index created before') &&
    d.url.includes('_indices_created_before_');
}
