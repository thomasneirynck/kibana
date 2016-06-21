import { keys, mapKeys, snakeCase, camelCase } from 'lodash';

function convertKeysToSpecifiedCaseDeep(object, caseConversionFunction) {
  // First recursively convert key names in nested objects
  keys(object).map(key => {
    const value = object[key];
    if (typeof value === 'object') {
      object[key] = convertKeysToSpecifiedCaseDeep(value, caseConversionFunction);
    }
  });

  // Then convert top-level key names
  return mapKeys(object, (value, key) => {
    return caseConversionFunction(key);
  });
}

export function convertKeysToSnakeCaseDeep(object) {
  return convertKeysToSpecifiedCaseDeep(object, snakeCase);
}

export function convertKeysToCamelCaseDeep(object) {
  return convertKeysToSpecifiedCaseDeep(object, camelCase);
}
