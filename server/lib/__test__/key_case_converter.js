import expect from 'expect.js';
import { convertKeysToSnakeCaseDeep, convertKeysToCamelCaseDeep } from '../key_case_converter';

describe('key_case_converter', () => {

  let testObject;

  beforeEach(() => {
    testObject = {
      topLevelKey1: {
        innerLevelKey1: 17,
        inner_level_key2: 19,
      },
      top_level_key2: {
        innerLevelKey1: 23,
        inner_level_key2: 29
      }
    };
  });

  it ('camelCaseToSnakeCaseDeep should recursively convert camelCase keys to snake_case keys', () => {
    const expectedResultObject = {
      top_level_key_1: {
        inner_level_key_1: 17,
        inner_level_key_2: 19,
      },
      top_level_key_2: {
        inner_level_key_1: 23,
        inner_level_key_2: 29
      }
    };
    expect(convertKeysToSnakeCaseDeep(testObject)).to.eql(expectedResultObject);
  });

  it ('snakeCaseToCamelCaseDeep should recursively convert snake_case keys to camelCase keys', () => {
    const expectedResultObject = {
      topLevelKey1: {
        innerLevelKey1: 17,
        innerLevelKey2: 19,
      },
      topLevelKey2: {
        innerLevelKey1: 23,
        innerLevelKey2: 29
      }
    };
    expect(convertKeysToCamelCaseDeep(testObject)).to.eql(expectedResultObject);
  });
});
