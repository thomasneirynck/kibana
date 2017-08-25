import _ from 'lodash';
import {
  INDEX_SUFFIX,
} from '../../../common/constants';


export function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function remapStringFields(mappings) {
  return _.transform(mappings, (result, mapping, type) => {
    const newMapping = { ...mapping };

    newMapping.properties = _.transform(mapping.properties, (acc, properties, field) => {
      const newProperties = { ...properties };

      if (properties.type && properties.type === 'string') {
        if (properties.index && properties.index === 'not_analyzed') {
          newProperties.type = 'keyword';
          delete newProperties.fielddata;
        } else {
          newProperties.type = 'text';
        }

        if (properties.index && properties.index === 'no') {
          newProperties.index = false;
        } else {
          delete newProperties.index;
        }
      }

      acc[field] = newProperties;
    }, {});

    result[type] = newMapping;
  }, {});
}

export function getUpgradedMappings(indexName, mappings) {
  return remapStringFields(mappings);
}

export function getUpgradedSettings(settings) {
  return {
    ...(_.omit(settings, [
      'index.uuid',
      'index.creation_date',
      'index.version.created',
      'index.version.upgraded',
      'index.provided_name',
      'index.blocks',
      'index.legacy',
    ])),
    'index.refresh_interval': -1,
    'index.format': 6,
  };
}

export function getReindexBody(indexName) {
  const suffix = INDEX_SUFFIX;

  const body = {
    source: {
      index: `${ indexName }`,
    },
    dest: {
      index: `${ indexName }${ suffix }`,
    },
  };

  return body;
}

export function getActionsForAliasesBody(oldAliases, indexName) {
  const suffix = INDEX_SUFFIX;
  const actions = _.transform(oldAliases, (result, aliasSettings, aliasName) => {
    const action = {
      add: {
        index: `${ indexName }${ suffix }`,
        alias: aliasName,
        ...aliasSettings,
      },
    };

    result.push(action);
  }, []);

  actions.push({
    remove_index: {
      index: indexName
    },
  });
  actions.push({
    add: {
      index: `${ indexName }${ suffix }`, "alias": indexName
    },
  });
  return actions;
}
