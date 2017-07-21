import _ from 'lodash';
import chrome from 'ui/chrome';
import {
  KIBANA_INDEX_SUFFIX,
  INDEX_SUFFIX,
} from '../../../common/constants';

import { kibanaMappings } from '../reindex/kibana';


export function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getDisplayName(Component) {
  return Component.displayName || Component.name || 'Component';
}

export function getIndexSuffix(indexName) {
  const kibanaIndex = chrome.getInjected('kbnIndex');
  if (indexName === kibanaIndex) {
    return KIBANA_INDEX_SUFFIX;
  } else {
    return INDEX_SUFFIX;
  }
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
  const kibanaIndex = chrome.getInjected('kbnIndex');

  return (indexName === kibanaIndex) ? kibanaMappings : remapStringFields(mappings);
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
  const suffix = getIndexSuffix(indexName);
  const kibanaIndex = chrome.getInjected('kbnIndex');

  const body = {
    source: {
      index: `${ indexName }`,
    },
    dest: {
      index: `${ indexName }${ suffix }`,
    },
  };

  if (indexName === kibanaIndex) {
    body.script = {
      inline: `
        ctx._source = [ ctx._type : ctx._source ];
        ctx._source.type = ctx._type;
        ctx._id = ctx._type + ":" + ctx._id;
        ctx._type = "doc";
      `
    };
  }

  return body;
}

export function getActionsForAliasesBody(oldAliases, indexName) {
  const suffix = getIndexSuffix(indexName);
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
