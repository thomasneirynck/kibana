import { LOGSTASH } from '../../../../../../common/constants';

export class Vertex {
  constructor(graph, json) {
    this.graph = graph;
    this.update(json);

    // Version of the representation used by webcola
    // this object is a bridge back to here, and also can be mutated by webcola
    // and d3, which like to change objects
    this.cola = this._makeCola();
  }

  update(json) {
    this.json = json;
  }

  // Should only be called by the constructor!
  // There is no reason to have > 1 instance of this!
  // There is really no good reason to add any additional fields here
  _makeCola() {
    const margin = LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.MARGIN_PX;
    return {
      vertex: this,
      // The margin size must be added since this is actually the size of the bounding box
      width: LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.WIDTH_PX + margin,
      height: LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.HEIGHT_PX + margin
    };
  }

  get colaIndex() {
    return this.graph.getVertices().indexOf(this);
  }

  get name() {
    return this.json.config_name;
  }

  get id() {
    return this.json.id;
  }

  get htmlAttrId() {
    // Substitute any non-word characters with an underscore so
    // D3 selections don't interpret them as special selector syntax
    return this.json.id.replace(/\W/g, '_');
  }

  get displayId() {
    const maxDisplayLength = LOGSTASH.PIPELINE_VIEWER.GRAPH.VERTICES.DISPLAY_ID_MAX_LENGTH_CHARS;
    if (this.id.length <= maxDisplayLength) {
      return this.id;
    }

    const ellipses = '\u2026';
    const eachHalfMaxDisplayLength = Math.floor((maxDisplayLength - ellipses.length) / 2);

    return `${this.id.substr(0, eachHalfMaxDisplayLength)}${ellipses}${this.id.substr(-eachHalfMaxDisplayLength)}`;
  }

  get incomingEdges() {
    return this.graph.edgesByTo[this.json.id] || [];
  }

  get incomingVertices() {
    return this.incomingEdges.map(e => e.from);
  }

  get outgoingEdges() {
    return this.graph.edgesByFrom[this.json.id] || [];
  }

  get outgoingVertices() {
    return this.outgoingEdges.map(e => e.to);
  }

  get isRoot() {
    return this.incomingVertices.length === 0;
  }

  get isLeaf() {
    return this.outgoingVertices.length === 0;
  }

  get rank() {
    return this.graph.vertexRankById[this.id];
  }

  get sourceLocation() {
    return `apc.conf@${this.meta.source_line}:${this.meta.source_column}`;
  }

  get sourceText() {
    return this.meta.source_text;
  }

  get meta() {
    return this.json.meta;
  }

  get stats() {
    return this.json.stats || {};
  }

  get hasCustomStats() {
    return Object.keys(this.customStats).length > 0;
  }

  get customStats() {
    return Object.keys(this.stats)
          .filter(k => !(k.match(/^events\./)))
          .filter(k => k !== 'name')
          .reduce((acc,k) => {
            acc[k] = this.stats[k];
            return acc;
          }, {});
  }

  get ancestors() {
    let vertices = [];
    let edges = [];
    vertices = vertices.concat(this.incomingVertices);
    edges = edges.concat(this.incomingEdges);
    this.incomingVertices.forEach(vertex => {
      const res = vertex.ancestors;
      vertices = vertices.concat(res.vertices);
      edges = edges.concat(res.edges);
    });
    return { vertices, edges };
  }

  get descendants() {
    let vertices = [];
    let edges = [];
    vertices = vertices.concat(this.outgoingVertices);
    edges = edges.concat(this.outgoingEdges);
    this.outgoingVertices.forEach(vertex => {
      const res = vertex.descendants;
      vertices = vertices.concat(res.vertices);
      edges = edges.concat(res.edges);
    });
    return { vertices, edges };
  }

  get lineage() {
    const ancestorsRes = this.ancestors;
    const descendantsRes = this.descendants;
    return {
      vertices: ancestorsRes.vertices.concat([this]).concat(descendantsRes.vertices),
      edges: ancestorsRes.edges.concat(descendantsRes.edges)
    };
  }

  get eventsPerCurrentPeriod() {
    if (!this.stats.hasOwnProperty('events.in')) {
      return null;
    }

    return (this.stats['events.in'].max - this.stats['events.in'].min);
  }

  get hasExplicitId() {
    return Boolean(this.json.explicit_id);
  }
}
