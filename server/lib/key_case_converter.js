import { clone, keys, mapKeys, snakeCase, camelCase } from 'lodash';

// Note: This function uses _.clone. This will clone objects created by constructors other than Object
// to plain Object objects. Uncloneable values such as functions, DOM nodes, Maps, Sets, and WeakMaps
// will be cloned to the empty object.
function convertKeysToSpecifiedCaseDeep(object, caseConversionFunction) {
  let newObject = clone(object);

  // First recursively convert key names in nested objects
  keys(object).map(key => {
    const value = object[key];
    if (typeof value === 'object') {
      newObject[key] = convertKeysToSpecifiedCaseDeep(value, caseConversionFunction);
    }
  });

  // Then convert top-level key names
  return mapKeys(newObject, (value, key) => {
    return caseConversionFunction(key);
  });
}

export function convertKeysToSnakeCaseDeep(object) {
  return convertKeysToSpecifiedCaseDeep(object, snakeCase);
}

export function convertKeysToCamelCaseDeep(object) {
  return convertKeysToSpecifiedCaseDeep(object, camelCase);
}
