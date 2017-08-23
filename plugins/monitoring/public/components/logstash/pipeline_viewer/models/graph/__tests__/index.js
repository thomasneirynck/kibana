import expect from 'expect.js';
import { Graph } from '../';
import { Vertex } from '../vertex';
import { PluginVertex } from '../plugin_vertex';
import { Edge } from '../edge';

describe('Graph', () => {
  it('initializes the Graph object correctly', () => {
    const graph = new Graph();
    expect(graph.json).to.be(null);
    expect(graph.verticesById).to.eql({});
    expect(graph.edgesById).to.eql({});
    expect(graph.edgesByFrom).to.eql({});
    expect(graph.edgesByTo).to.eql({});
  });

  describe('updating the Graph object', () => {
    let graphJson;
    let graph;

    beforeEach(() => {
      /**
       *       my-prefix:...generator
       *                 |
       *                 v
       *             my-queue
       *                 |
       *                 v
       *               my-if
       *           (T) /   \ (F)
       *              v     v
       *         my-grok   my-sleep
       */
      graphJson = {
        vertices: [
          { id: 'my-prefix:my-really-long-named-generator', type: 'plugin', explicit_id: false },
          { id: 'my-queue', type: 'queue', config_name: 'some-name' },
          { id: 'my-if', type: 'if', config_name: 'some-name' },
          { id: 'my-grok', type: 'plugin', plugin_type: 'filter' },
          { id: 'my-sleep', type: 'plugin', plugin_type: 'filter', explicit_id: true }
        ],
        edges: [
          { id: 'abcdef', type: 'plain', from: 'my-prefix:my-really-long-named-generator', to: 'my-queue' },
          { id: '123456', type: 'plain', from: 'my-queue', to: 'my-if' },
          { id: 'if-true', type: 'boolean', when: true, from: 'my-if', to: 'my-grok' },
          { id: 'if-false', type: 'boolean', when: false, from: 'my-if', to: 'my-sleep' }
        ]
      };
      graph = new Graph();
      graph.update(graphJson);
    });

    it('updates the internal json correctly', () => {
      expect(graph.json).to.eql(graphJson);
    });

    it('updates vertices-by-id correctly', () => {
      expect(Object.keys(graph.verticesById).length).to.be(5);
      expect(graph.verticesById['my-prefix:my-really-long-named-generator']).to.be.a(Vertex);
      expect(graph.verticesById['my-queue']).to.be.a(Vertex);
      expect(graph.verticesById['my-if']).to.be.a(Vertex);
      expect(graph.verticesById['my-grok']).to.be.a(Vertex);
      expect(graph.verticesById['my-sleep']).to.be.a(Vertex);
    });

    it('updates edges-by-id correctly', () => {
      expect(Object.keys(graph.edgesById).length).to.be(4);
      expect(graph.edgesById.abcdef).to.be.an(Edge);
      expect(graph.edgesById['123456']).to.be.an(Edge);
      expect(graph.edgesById['if-true']).to.be.an(Edge);
      expect(graph.edgesById['if-false']).to.be.an(Edge);
    });

    it('updates edges-by-from correctly', () => {
      expect(Object.keys(graph.edgesByFrom).length).to.be(3);

      expect(graph.edgesByFrom['my-prefix:my-really-long-named-generator']).to.be.an(Array);
      expect(graph.edgesByFrom['my-prefix:my-really-long-named-generator'].length).to.be(1);

      expect(graph.edgesByFrom['my-queue']).to.be.an(Array);
      expect(graph.edgesByFrom['my-queue'].length).to.be(1);

      expect(graph.edgesByFrom['my-if']).to.be.an(Array);
      expect(graph.edgesByFrom['my-if'].length).to.be(2);
    });

    it('updates edges-by-to correctly', () => {
      expect(Object.keys(graph.edgesByTo).length).to.be(4);

      expect(graph.edgesByTo['my-queue']).to.be.an(Array);
      expect(graph.edgesByTo['my-queue'].length).to.be(1);

      expect(graph.edgesByTo['my-if']).to.be.an(Array);
      expect(graph.edgesByTo['my-if'].length).to.be(1);

      expect(graph.edgesByTo['my-grok']).to.be.an(Array);
      expect(graph.edgesByTo['my-grok'].length).to.be(1);

      expect(graph.edgesByTo['my-sleep']).to.be.an(Array);
      expect(graph.edgesByTo['my-sleep'].length).to.be(1);
    });

    it('identifies the correct vertex by ID', () => {
      const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
      expect(vertex1).to.be.a(Vertex);
      expect(vertex1.json.id).to.be('my-prefix:my-really-long-named-generator');

      const vertex2 = graph.getVertexById('my-sleep');
      expect(vertex2).to.be.a(Vertex);
      expect(vertex2.json.id).to.be('my-sleep');
    });

    it('identifies the same vertices in a deterministic order', () => {
      const vertices1 = graph.getVertices();
      expect(vertices1).to.be.an(Array);
      expect(vertices1.length).to.be(5);

      vertices1.forEach(vertex1 => {
        expect(vertex1).to.be.a(Vertex);
      });

      const vertices2 = graph.getVertices();
      vertices2.forEach((vertex2, i) => {
        expect(vertex2).to.be(vertices1[i]);
      });
    });

    it('identifies the correct processor vertices', () => {
      const processorVertices = graph.processorVertices;
      expect(processorVertices).to.be.an(Array);
      expect(processorVertices.length).to.be(2);

      processorVertices.forEach(processorVertex => {
        expect(processorVertex).to.be.a(Vertex);
        expect(processorVertex).to.be.a(PluginVertex);
        expect(processorVertex.isProcessor).to.be(true);
      });
    });

    it('identifies cola representations of vertices correctly', () => {
      const colaVertices = graph.colaVertices;
      expect(colaVertices).to.be.an(Array);
      expect(colaVertices.length).to.be(5);

      expect(colaVertices[0]).to.have.property('vertex');
      expect(colaVertices[0]).to.have.property('width');
      expect(colaVertices[0]).to.have.property('height');
    });

    it('identifies the correct edges', () => {
      const edges = graph.edges;
      expect(edges).to.be.an(Array);
      expect(edges.length).to.be(4);

      edges.forEach(edge => {
        expect(edge).to.be.an(Edge);
      });
    });

    it('identifies cola representations of edges correctly', () => {
      const colaEdges = graph.colaEdges;
      expect(colaEdges).to.be.an(Array);
      expect(colaEdges.length).to.be(4);

      colaEdges.forEach(colaEdge => {
        expect(colaEdge).to.have.property('edge');
        expect(colaEdge).to.have.property('source');
        expect(colaEdge).to.have.property('target');
      });
    });

    it('identifies its root vertices correctly', () => {
      const roots = graph.roots;
      expect(roots).to.be.an(Array);
      expect(roots.length).to.be(1);

      roots.forEach(root => {
        expect(root).to.be.a(Vertex);
        expect(root.json.id).to.be('my-prefix:my-really-long-named-generator');
      });
    });

    it('identifies its leaf vertices correctly', () => {
      const leaves = graph.leaves;
      expect(leaves).to.be.an(Array);
      expect(leaves.length).to.be(2);

      leaves.forEach(leaf => {
        expect(leaf).to.be.a(Vertex);
      });
    });

    it('identifies the highest vertex rank correctly', () => {
      expect(graph.maxRank).to.be(3);
    });

    describe('vertex layout ranking', () => {
      const expectedRanks = [
        ['my-prefix:my-really-long-named-generator'],
        ['my-queue'],
        ['my-if'],
        ['my-grok', 'my-sleep']
      ];

      it('should store a 2d array of the vertices in the expected ranks', () => {
        const result = graph.verticesByLayoutRank;
        expectedRanks.forEach((expectedVertexIds, rank) => {
          const resultVertices = result[rank];
          expectedVertexIds.forEach(expectedVertexId => {
            const expectedVertex = graph.getVertexById(expectedVertexId);
            expect(resultVertices).to.contain(expectedVertex);
          });
        });
      });

      it('should add a .layoutRank property to each Vertex', () => {
        expectedRanks.forEach((expectedVertexIds, rank) => {
          expectedVertexIds.forEach(expectedVertexId => {
            const vertex = graph.getVertexById(expectedVertexId);
            expect(vertex.layoutRank).to.be(rank);
          });
        });
      });
    });

    it('should classify the if triangle correctly', () => {
      expect(graph.triangularIfGroups.length).to.be(1);
      expect(graph.triangularIfGroups[0]).to.eql({
        ifVertex: graph.getVertexById('my-if'),
        trueVertex: graph.getVertexById('my-grok'),
        falseVertex: graph.getVertexById('my-sleep'),
      });
    });
  });
});
