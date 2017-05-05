import { set } from 'lodash';
import expect from 'expect.js';
import { calculateNodeType } from '../calculate_node_type.js';

const masterNodeId = 'def456';

describe('Calculating Node Type from Attributes', () => {
  it('Calculates default', () => {
    const node = {};
    const result = calculateNodeType(node, masterNodeId);
    expect(result).to.be.eql('node');
  });
  it('Calculates master_only', () => {
    const node = set({}, 'attributes', { master: 'true', data: 'false' });
    const result = calculateNodeType(node, masterNodeId);
    expect(result).to.be.eql('master_only');
  });
  it('Calculates data', () => {
    const node = set({}, 'attributes', { master: 'false', data: 'true' });
    const result = calculateNodeType(node, masterNodeId);
    expect(result).to.be.eql('data');
  });
  it('Calculates client', () => {
    const node = set({}, 'attributes', { master: 'false', data: 'false' });
    const result = calculateNodeType(node, masterNodeId);
    expect(result).to.be.eql('client');
  });
  it('Calculates master', () => {
    const node = { node_ids: ['abc123', 'def456'] };
    const result = calculateNodeType(node, masterNodeId);
    expect(result).to.be.eql('master');
  });
});
