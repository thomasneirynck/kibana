import expect from 'expect.js';
import { edgeFactory } from '../edge_factory';
import { PlainEdge } from '../plain_edge';
import { BooleanEdge } from '../boolean_edge';

describe('edgeFactory', () => {
  let graph;
  let edgeJson;

  beforeEach(() => {
    graph = {
      verticesById: {
        mygenerator: {},
        myqueue: {}
      }
    };
    edgeJson = {
      id: 12345,
      from: 'mygenerator',
      to: 'myqueue'
    };
  });

  it('returns a PlainEdge when edge type is plain', () => {
    edgeJson.type = 'plain';
    expect(edgeFactory(graph, edgeJson)).to.be.a(PlainEdge);
  });

  it('returns a BooleanEdge when edge type is boolean', () => {
    edgeJson.type = 'boolean';
    expect(edgeFactory(graph, edgeJson)).to.be.a(BooleanEdge);
  });

  it('throws an error when edge type is unknown', () => {
    edgeJson.type = 'foobar';
    const fn = () => edgeFactory(graph, edgeJson);
    expect(fn).to.throwError();
  });
});