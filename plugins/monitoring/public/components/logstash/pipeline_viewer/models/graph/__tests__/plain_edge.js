import expect from 'expect.js';
import { PlainEdge } from '../plain_edge';
import { Edge } from '../edge';
import { LOGSTASH } from '../../../../../../../common/constants';

describe('PlainEdge', () => {
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
      id: 'abcdef',
      from: 'mygenerator',
      to: 'myqueue'
    };
  });

  it('should be an instance of Edge', () => {
    const plainEdge = new PlainEdge(graph, edgeJson);
    expect(plainEdge).to.be.a(Edge);
  });

  it('should have the correct SVG CSS class', () => {
    const plainEdge = new PlainEdge(graph, edgeJson);
    const edgeSvgClass = LOGSTASH.PIPELINE_VIEWER.GRAPH.EDGES.SVG_CLASS;
    expect(plainEdge.svgClass).to.be(`${edgeSvgClass} ${edgeSvgClass}Plain`);
  });
});