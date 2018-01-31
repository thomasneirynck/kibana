import { flattenObject } from '../../public/lib/flatten_object';
describe('flatten_object', () => {
  test('it flattens an object', () => {
    const obj = {
      foo: {
        nested: {
          field: 1
        }
      },
      bar: 3
    };
    expect(flattenObject(obj)).toMatchSnapshot();
  });
  test('it flattens an object that contains an array in a field', () => {
    const obj = {
      foo: {
        nested: {
          field: [
            1, 2, 3
          ]
        }
      },
      bar: 3
    };
    expect(flattenObject(obj)).toMatchSnapshot();
  });
});