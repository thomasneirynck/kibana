import expect from 'expect.js';
import { createFormatCsvValues } from '../format_csv_values';

describe('formatCsvValues', function () {
  const separator = ',';
  const fields = ['foo', 'bar'];
  const mockEscapeValue = val => val;
  const formatCsvValues = createFormatCsvValues(mockEscapeValue, separator, fields);

  it('should use the specified separator', function () {
    expect(formatCsvValues({})).to.be(separator);
  });

  it('should replace null and undefined with empty strings', function () {
    const values = {
      foo: undefined,
      bar: null
    };
    expect(formatCsvValues(values)).to.be(',');
  });

  it('should JSON.stringify objects', function () {
    const values = {
      foo: {
        baz: 'qux'
      },
    };
    expect(formatCsvValues(values)).to.be('{"baz":"qux"},');
  });

  it('should concatenate strings', function () {
    const values = {
      foo: 'baz',
      bar: 'qux'
    };
    expect(formatCsvValues(values)).to.be('baz,qux');
  });

});
