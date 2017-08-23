import expect from 'expect.js';
import { Graph } from '../';
import { LOGSTASH } from '../../../../../../../common/constants';

describe('Vertex', () => {
  let graph;

  const graphJson = {
    vertices: [
      { id: 'my-prefix:my-really-long-named-generator', type: 'plugin', explicit_id: false },
      { id: 'my-queue', type: 'queue', config_name: 'some-name' },
      { id: 'my-if', type: 'if', config_name: 'some-name' },
      { id: 'my-grok', type: 'plugin', meta: { source_text: 'foobar', source_line: 33, source_column: 4 } },
      { id: 'my-sleep', type: 'plugin', explicit_id: true, stats: { mystat1: 100, 'events.in': { min: 100, max: 120 } } }
    ],
    edges: [
      { id: 'abcdef', type: 'plain', from: 'my-prefix:my-really-long-named-generator', to: 'my-queue' },
      { id: '123456', type: 'plain', from: 'my-queue', to: 'my-if' },
      { id: 'if-true', type: 'plain', from: 'my-if', to: 'my-grok' },
      { id: 'if-false', type: 'plain', from: 'my-if', to: 'my-sleep' }
    ]
  };

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
    graph = new Graph();
    graph.update(graphJson);
  });

  it('should initialize the webcola representation', () => {
    const margin = LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.MARGIN_PX;
    const vertex = graph.getVertexById('my-queue');
    expect(vertex.cola).to.eql({
      vertex: vertex,
      width: LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.WIDTH_PX + margin,
      height: LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.HEIGHT_PX + margin
    });
  });

  it('should update the internal json property when update() is called', () => {
    const vertex = graph.getVertexById('my-queue');
    const updatedJson = {
      config_name: 'my-stdin'
    };
    vertex.update(updatedJson);
    expect(vertex.json).to.eql(updatedJson);
  });

  it('should not change the webcola index after update', () => {
    const verticesIds = graph.getVertices().map(v => [v.id, v.colaIndex]);
    graph.update(graphJson);
    verticesIds.forEach(idAndIndex => {
      const [id, colaIndex] = idAndIndex;
      const v = graph.getVertexById(id);
      console.log("MATCH", v.id, id);
      expect(v).not.to.be(undefined);
      expect(v.colaIndex).to.be(colaIndex);
    });
  });

  it('should have the correct name', () => {
    const vertex = graph.getVertexById('my-queue');
    expect(vertex.name).to.be('some-name');
  });

  it('should return the JSON id directly as the id', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.id).to.be(vertex1.json.id);
  });

  it('should have the correct domID', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.domId).to.be('my_prefix_my_really_long_named_generator');

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.domId).to.be('my_queue');
  });

  it('should have the correct display ID', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.displayId).to.be('my-pref…nerator');

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.displayId).to.be('my-queue');
  });

  it('should have the correct number of incoming edges', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.incomingEdges.length).to.be(0);

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.incomingEdges.length).to.be(1);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.incomingEdges.length).to.be(1);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.incomingEdges.length).to.be(1);

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.incomingEdges.length).to.be(1);
  });

  it('should have the correct number of incoming vertices', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.incomingVertices.length).to.be(0);

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.incomingVertices.length).to.be(1);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.incomingEdges.length).to.be(1);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.incomingVertices.length).to.be(1);

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.incomingEdges.length).to.be(1);
  });

  it('should have the correct number of outgoing edges', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.outgoingEdges.length).to.be(1);

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.outgoingEdges.length).to.be(1);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.outgoingEdges.length).to.be(2);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.outgoingEdges.length).to.be(0);

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.outgoingEdges.length).to.be(0);
  });

  it('should have the correct number of outgoing vertices', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.outgoingVertices.length).to.be(1);

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.outgoingVertices.length).to.be(1);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.outgoingVertices.length).to.be(2);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.outgoingVertices.length).to.be(0);

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.outgoingVertices.length).to.be(0);
  });

  it('should correctly identify as a root vertex', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.isRoot).to.be(true);

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.isRoot).to.be(false);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.isRoot).to.be(false);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.isRoot).to.be(false);

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.isRoot).to.be(false);
  });

  it('should correctly identify as a leaf vertex', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.isLeaf).to.be(false);

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.isLeaf).to.be(false);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.isLeaf).to.be(false);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.isLeaf).to.be(true);

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.isLeaf).to.be(true);
  });

  it('should have the correct rank', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.rank).to.be(0);

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.rank).to.be(1);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.rank).to.be(2);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.rank).to.be(3);

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.rank).to.be(3);
  });

  it('should have the correct source location', () => {
    const vertex = graph.getVertexById('my-grok');
    expect(vertex.sourceLocation).to.be('apc.conf@33:4');
  });

  it('should have the correct source text', () => {
    const vertex = graph.getVertexById('my-grok');
    expect(vertex.sourceText).to.be('foobar');
  });

  it('should have the correct metadata', () => {
    const vertex = graph.getVertexById('my-grok');
    expect(vertex.meta).to.eql({ source_text: 'foobar', source_line: 33, source_column: 4 });
  });

  it('should have the correct stats', () => {
    const vertex1 = graph.getVertexById('my-sleep');
    expect(vertex1.stats).to.eql({ mystat1: 100, 'events.in': { min: 100, max: 120 } });

    const vertex2 = graph.getVertexById('my-grok');
    expect(vertex2.stats).to.eql({});
  });

  it('should correctly identify if it has custom stats', () => {
    const vertex1 = graph.getVertexById('my-sleep');
    expect(vertex1.hasCustomStats).to.be(true);

    const vertex2 = graph.getVertexById('my-grok');
    expect(vertex2.hasCustomStats).to.be(false);
  });

  it('should correctly report custom stats', () => {
    const vertex1 = graph.getVertexById('my-sleep');
    expect(vertex1.customStats).to.eql({ mystat1: 100 });

    const vertex2 = graph.getVertexById('my-grok');
    expect(vertex2.customStats).to.eql({});
  });

  it('should have the correct ancestors', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.ancestors).to.eql({ vertices: [], edges: [] });

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.ancestors.vertices.length).to.be(1);
    expect(vertex2.ancestors.edges.length).to.be(1);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.ancestors.vertices.length).to.be(2);
    expect(vertex3.ancestors.edges.length).to.be(2);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.ancestors.vertices.length).to.be(3);
    expect(vertex4.ancestors.edges.length).to.be(3);

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.ancestors.vertices.length).to.be(3);
    expect(vertex5.ancestors.edges.length).to.be(3);
  });

  it('should have the correct descendants', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.descendants.vertices.length).to.be(4);
    expect(vertex1.descendants.edges.length).to.be(4);

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.descendants.vertices.length).to.be(3);
    expect(vertex2.descendants.edges.length).to.be(3);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.descendants.vertices.length).to.be(2);
    expect(vertex3.descendants.edges.length).to.be(2);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.descendants).to.eql({ vertices: [], edges: [] });

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.descendants).to.eql({ vertices: [], edges: [] });
  });

  it('should have the correct lineage', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.lineage.vertices.length).to.be(5);
    expect(vertex1.lineage.edges.length).to.be(4);

    const vertex2 = graph.getVertexById('my-queue');
    expect(vertex2.lineage.vertices.length).to.be(5);
    expect(vertex2.lineage.edges.length).to.be(4);

    const vertex3 = graph.getVertexById('my-if');
    expect(vertex3.lineage.vertices.length).to.be(5);
    expect(vertex3.lineage.edges.length).to.be(4);

    const vertex4 = graph.getVertexById('my-grok');
    expect(vertex4.lineage.vertices.length).to.be(4);
    expect(vertex4.lineage.edges.length).to.be(3);

    const vertex5 = graph.getVertexById('my-sleep');
    expect(vertex5.lineage.vertices.length).to.be(4);
    expect(vertex5.lineage.edges.length).to.be(3);
  });

  it('should have the correct events per current period', () => {
    const vertex1 = graph.getVertexById('my-sleep');
    expect(vertex1.eventsPerCurrentPeriod).to.be(20);

    const vertex2 = graph.getVertexById('my-grok');
    expect(vertex2.eventsPerCurrentPeriod).to.be(null);
  });

  it('should correctly identify if it has an explicit ID', () => {
    const vertex1 = graph.getVertexById('my-prefix:my-really-long-named-generator');
    expect(vertex1.hasExplicitId).to.be(false);

    const vertex2 = graph.getVertexById('my-sleep');
    expect(vertex2.hasExplicitId).to.be(true);
  });

});
