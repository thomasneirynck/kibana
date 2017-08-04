import expect from 'expect.js';
import { QueueVertex } from '../queue_vertex';
import { Vertex } from '../vertex';

describe('QueueVertex', () => {
  let graph;
  let vertexJson;

  beforeEach(() => {
    graph = {};
    vertexJson = {};
  });

  it('should be an instance of Vertex', () => {
    const queueVertex = new QueueVertex(graph, vertexJson);
    expect(queueVertex).to.be.a(Vertex);
  });

  it('should have a type of queue', () => {
    const queueVertex = new QueueVertex(graph, vertexJson);
    expect(queueVertex.typeString).to.be('queue');
  });
});