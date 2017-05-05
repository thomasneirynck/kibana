import { nodeTypeClass, nodeTypeLabel } from '../lookups';
import expect from 'expect.js';
import _ from 'lodash';

describe('Node Types Lookups', () => {
  it('Has matching classes and labels', () => {
    const classKeys = Object.keys(nodeTypeClass);
    const labelKeys = Object.keys(nodeTypeLabel);
    const typeKeys = [ 'client', 'data', 'invalid', 'master', 'master_only', 'node' ];
    classKeys.sort();
    labelKeys.sort();
    expect(classKeys).to.be.eql(typeKeys);
    expect(labelKeys).to.be.eql(typeKeys);
  });

  it('Has usable values', () => {
    _.each(nodeTypeClass, (value) => {
      expect(value).to.be.a('string');
    });
    _.each(nodeTypeLabel, (value) => {
      expect(value).to.be.a('string');
    });
  });
});
