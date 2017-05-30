import { isObject, isNull, isUndefined } from 'lodash';

export function createFormatCsvValues(escapeValue, separator, fields) {
  return function formatCsvValues(values) {
    return fields.map((field) => {
      const value = values[field];
      if (isNull(value) || isUndefined(value)) {
        return '';
      }

      if (isObject(value)) {
        return JSON.stringify(value);
      }

      return value.toString();
    })
    .map(escapeValue)
    .join(separator);
  };
}
