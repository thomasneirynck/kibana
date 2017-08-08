import React from 'react';
import d3 from 'd3';
import { PluginVertex } from '../models/graph/plugin_vertex';
import { IfVertex } from '../models/graph/if_vertex';
import { QueueVertex } from '../models/graph/queue_vertex';
import {
  enterInputVertex,
  enterProcessorVertex,
  enterIfVertex,
  enterQueueVertex,
  updateInputVertex,
  updateProcessorVertex
} from './vertex_content_renderer';
import { LOGSTASH } from '../../../../../common/constants';
import webcola from 'webcola';

function makeMarker(svgDefs, id, fill) {
  svgDefs.append('marker')
    .attr('id', id)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 5)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('path')
    .attr('d', 'M0,-5L10,0L0,5L2,0')
    .attr('stroke-width', '0px')
    .attr('fill', fill);
}

function makeBackground(parentEl) {
  return parentEl
    .append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#efefef');
}

function makeGroup(parentEl) {
  return parentEl
    .append('g');
}

function makeNodes(nodesLayer, colaVertices) {
  const nodes = nodesLayer
    .selectAll('.lspvVertex')
    .data(colaVertices, d => d.vertex.id);

  nodes
    .enter()
    .append('g')
      .attr('id', d => `nodeg-${d.vertex.id}`)
      .attr('class', d => `lspvVertex ${d.vertex.typeString}`)
      .attr('width', LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.WIDTH_PX)
      .attr('height', LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.HEIGHT_PX);

  nodes
    .append('rect')
      .attr('class', 'lspvVertexBounding')
      .attr('rx', LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.BORDER_RADIUS_PX)
      .attr('ry', LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.BORDER_RADIUS_PX);

  return nodes;
}

function addNodesMouseBehaviors(nodes, onMouseover, onMouseout) {
  nodes.on('mouseover', onMouseover);
  nodes.on('mouseout', onMouseout);
}

function makeInputNodes(nodes) {
  const inputs = nodes.filter(node => (node.vertex instanceof PluginVertex) && node.vertex.isInput);
  inputs.call(enterInputVertex);

  return inputs;
}

function makeProcessorNodes(nodes) {
  const processors = nodes.filter(node => (node.vertex instanceof PluginVertex) && node.vertex.isProcessor);
  processors.call(enterProcessorVertex);

  return processors;
}

function makeIfNodes(nodes) {
  const ifs = nodes.filter(d => d.vertex instanceof IfVertex);
  ifs.call(enterIfVertex);

  return ifs;
}

function makeQueueNode(nodes) {
  const queue = nodes.filter(d => d.vertex instanceof QueueVertex);
  queue.call(enterQueueVertex);

  return queue;
}

// Line function for drawing paths between nodes
const lineFunction = d3.svg.line()
  // Null check that handles a bug in webcola where sometimes these values are null for a tick
  .x(d => d ? d.x : null)
  .y(d => d ? d.y : null)
  // Cardinal interpolation draws curved lines
  .interpolate('cardinal');

export class ColaGraph extends React.Component {
  constructor() {
    super();
    this.state = {};

    this.width = 1000;
    this.height = 1000;
  }

  renderGraph(svgEl) {
    this.d3cola = webcola.d3adaptor()
      .avoidOverlaps(true)
      .size([this.width, this.height]);

    const outer = d3.select(svgEl);
    const background = makeBackground(outer);

    const svgDefs = outer.append('defs');
    makeMarker(svgDefs, 'lspvPlainMarker', '#000');
    makeMarker(svgDefs, 'lspvTrueMarker', '#1BAFD2');
    makeMarker(svgDefs, 'lspvFalseMarker', '#EE408A');

    // Set initial zoom to 100%. You need both the translate and scale options
    const zoom = d3.behavior.zoom().translate([100,100]).scale(1);
    const vis = outer
      .append('g')
      .attr('transform', 'translate(0,0) scale(1)');

    const redraw = () => {
      vis.attr('transform', `translate(${d3.event.translate}) scale(${d3.event.scale})`);
    };

    outer.call(d3.behavior.zoom().on('zoom', redraw));
    background.call(zoom.on('zoom', redraw));

    this.nodesLayer = makeGroup(vis);
    const nodes = makeNodes(this.nodesLayer, this.graph.colaVertices);

    this.inputs = makeInputNodes(nodes);
    this.processors = makeProcessorNodes(nodes);
    this.ifs = makeIfNodes(nodes);
    this.queue = makeQueueNode(nodes);

    addNodesMouseBehaviors(nodes, this.onMouseover, this.onMouseout);

    this.linksLayer = makeGroup(vis);

    this.d3cola
        .nodes(this.graph.colaVertices)
        .links(this.graph.colaEdges)
        .flowLayout('y', LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.HEIGHT_PX + LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.VERTICAL_DISTANCE_PX)
        .constraints(this._getConstraints())
        .jaccardLinkLengths(40)
        .start(30,30,30);

    this.makeLinks();

    const margin = LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.MARGIN_PX;
    this.d3cola.on('tick', () => {
      nodes.each((d) => d.innerBounds = d.bounds.inflate(-margin));

      this.links.attr('d', (d) => {
        const arrowStart = LOGSTASH.PIPELINE_VIEWER.GRAPH.EDGES.ARROW_START;
        const route = webcola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, arrowStart);
        return lineFunction([route.sourceIntersection, route.arrowStart]);
      });

      nodes
        .attr('transform', (d) => `translate(${d.innerBounds.x}, ${d.innerBounds.y})`);

      nodes.select('rect')
        .attr('width', (d) => d.innerBounds.width())
        .attr('height', (d) => d.innerBounds.height());

      this.routeAndLabelEdges();
    }).on('end', this.routeAndLabelEdges);
  }

  routeAndLabelEdges = () => {
    this.routeEdges();
    this.labelEdges();
  }

  routeEdges() {
    this.d3cola.prepareEdgeRouting(LOGSTASH.PIPELINE_VIEWER.GRAPH.EDGES.ROUTING_MARGIN_PX);
    this.links.select('path').attr('d', (d) => {
      try {
        return lineFunction(this.d3cola.routeEdge(d));
      } catch (err) {
        console.error('Could not exec line function!', err);
      }
    });
  }

  labelEdges() {
    // Use a regular function instead of () => since we want the dom element via `this`,
    // only accessible via d3 setting 'this' AFAIK
    this.booleanLabels.each(function () {
      const path = d3.select(this.parentNode).select('path')[0][0];
      const center = path.getPointAtLength(path.getTotalLength() / 2);
      const group = d3.select(this);
      group.select('circle')
        .attr('cx', center.x)
        .attr('cy', center.y);

      // Offset by to vertically center the text
      const textVerticalOffset = 5;
      group.select('text')
        .attr('x', center.x)
        .attr('y', center.y + textVerticalOffset);
    });
  }

  makeLinks() {
    this.links = this.linksLayer.selectAll('.link')
      .data(this.graph.colaEdges);

    const linkGroup = this.links.enter()
      .append('g')
        .attr('id', (d) => `lspvEdge-${d.edge.id}`)
        .attr('class', (d) => d.edge.svgClass);
    linkGroup.append('path');

    const booleanLinks = linkGroup.filter('.lspvEdgeBoolean');
    this.booleanLabels = booleanLinks
      .append('g')
      .attr('class', 'lspvBooleanLabel');

    this.booleanLabels
      .append('circle')
        .attr('r', LOGSTASH.PIPELINE_VIEWER.GRAPH.EDGES.LABEL_RADIUS);
    this.booleanLabels
      .append('text')
        .attr('text-anchor', 'middle') // Position the text on its vertical
        .text(d => d.edge.when ? 'T' : 'F');
  }

  updateGraph(nextState = {}) {
    this.processors.call(updateProcessorVertex);
    this.inputs.call(updateInputVertex);

    this.nodesLayer.selectAll('.lspvVertexBounding-highlighted').classed('lspvVertexBounding-highlighted', false);
    this.nodesLayer.selectAll('.lspvVertex-grayed').classed('lspvVertex-grayed', false);
    this.linksLayer.selectAll('.lspvEdge-grayed').classed('lspvEdge-grayed', false);

    const hoverNode = nextState.hoverNode;
    if (hoverNode) {
      const selection = this.nodesLayer
        .selectAll('#nodeg-' + hoverNode.vertex.id)
        .selectAll('rect');
      selection.classed('lspvVertexBounding-highlighted', true);

      const lineage = hoverNode.vertex.lineage;

      const lineageVertices = lineage.vertices;
      const nonLineageVertices = this.graph.getVertices().filter(v => lineageVertices.indexOf(v) === -1);
      const grayedVertices = this.nodesLayer.selectAll('g.lspvVertex').filter(d => nonLineageVertices.indexOf(d.vertex) >= 0);
      grayedVertices.classed('lspvVertex-grayed', true);

      const lineageEdges = lineage.edges;
      const nonLineageEdges = this.graph.edges.filter(e => lineageEdges.indexOf(e) === -1);
      const grayedEdges = this.linksLayer.selectAll('.lspvEdge').filter(d => nonLineageEdges.indexOf(d.edge) >= 0);
      grayedEdges.classed('lspvEdge-grayed', true);
    }
  }

  onMouseover = (node) => {
    this.setState({ hoverNode: node });
  }

  onMouseout = () => {
    this.setState({ hoverNode: null });
  }

  get graph() {
    return this.props.graph;
  }

  _getConstraints() {
    const sepRank = this.graph.getSeparatedRanks();
    const entries = Array.from(sepRank.entries());
    const constraints = [];

    entries.forEach((entry) => {
      const [rank, vertices] = entry;

      // Ensure that nodes of an equal rank, that is their distance from
      // the root are aligned on the y axis. Without this you get a longer
      // less compact graph rendering
      const rankOffsets = vertices.map(v => {
        return { node: v.colaIndex, offset: 0 };
      });
      constraints.push(
        {
          type: 'alignment',
          axis: 'y',
          offsets: rankOffsets
        }
      );

      if (rank > 0) {
        const previousVertices = sepRank.get(rank - 1);

        if (vertices.length === 1 &&
              previousVertices.length === 1 &&
              previousVertices[0].outgoingVertices.length < 3) {

          // Without this webcola willl generate a graph that drifts diagonally
          // to the right. This is a waste of space and hard to follow. The code here
          // keeps things aligned on the x axis
          constraints.push({
            type: 'alignment',
            axis: 'x',
            offsets: [
              { node: vertices[0].colaIndex, offset: 0 },
              { node: previousVertices[0].colaIndex, offset: 0 }
            ]
          });
        }
      }
    });

    return constraints;
  }

  render() {
    const viewBox = `0,0,${this.width},${this.height}`;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        ref={ svgEl => this.renderGraph(svgEl) }
        width="100%"
        height="100%"
        preserveAspectRatio="xMinYMin meet"
        viewBox={ viewBox }
        pointerEvents="all"
      />
    );
  }

  componentDidMount() {
    this.updateGraph();
  }

  shouldComponentUpdate(_nextProps, nextState) {
    // Let D3 control updates to this component's DOM.
    this.updateGraph(nextState);

    // Since D3 is controlling any updates to this component's DOM,
    // we don't want React to update this component's DOM.
    return false;
  }
}
