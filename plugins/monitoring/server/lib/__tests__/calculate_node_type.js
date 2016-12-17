import calculateNodeType from '../calculate_node_type.js';
import expect from 'expect.js';
import _ from 'lodash';

describe('Calculating Node Type from Attributes', () => {
  it('Calculates default', () => {
    const node = {};
    const state = {};
    const result = calculateNodeType(node, state);
    expect(result).to.be.eql('node');
  });
  it('Calculates master_only', () => {
    const node = _.set({}, 'attributes', {master: 'true', data: 'false'});
    const state = {};
    const result = calculateNodeType(node, state);
    expect(result).to.be.eql('master_only');
  });
  it('Calculates data', () => {
    const node = _.set({}, 'attributes', {master: 'false', data: 'true'});
    const state = {};
    const result = calculateNodeType(node, state);
    expect(result).to.be.eql('data');
  });
  it('Calculates client', () => {
    const node = _.set({}, 'attributes', {master: 'false', data: 'false'});
    const state = {};
    const result = calculateNodeType(node, state);
    expect(result).to.be.eql('client');
  });
  it('Calculates master', () => {
    const node = { node_ids: ['abc123', 'def456']};
    const state = { master_node: 'def456' };
    const result = calculateNodeType(node, state);
    expect(result).to.be.eql('master');
  });
});
