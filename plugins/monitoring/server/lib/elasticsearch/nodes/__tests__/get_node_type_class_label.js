import expect from 'expect.js';
import { getNodeTypeClassLabel } from '../get_node_type_class_label';

describe('Node Type and Label', () => {
  describe('when master node', () => {
    it('type is indicated by boolean flag', () => {
      const node = {
        master: true
      };
      const { nodeType, nodeTypeLabel, nodeTypeClass } = getNodeTypeClassLabel(node);
      expect(nodeType).to.be('master');
      expect(nodeTypeLabel).to.be('Master Node');
      expect(nodeTypeClass).to.be('fa-star');
    });
    it('type is indicated by string', () => {
      const node = {};
      const type = 'master';
      const { nodeType, nodeTypeLabel, nodeTypeClass } = getNodeTypeClassLabel(node, type);
      expect(nodeType).to.be('master');
      expect(nodeTypeLabel).to.be('Master Node');
      expect(nodeTypeClass).to.be('fa-star');
    });
  });
  it('when type is generic node', () => {
    const node = {};
    const type = 'node';
    const { nodeType, nodeTypeLabel, nodeTypeClass } = getNodeTypeClassLabel(node, type);
    expect(nodeType).to.be('node');
    expect(nodeTypeLabel).to.be('Node');
    expect(nodeTypeClass).to.be('fa-server');
  });
});
