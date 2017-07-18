import { PluginVertex } from './plugin_vertex';
import { QueueVertex } from './queue_vertex';
import { vertexFactory } from './vertex_factory';
import { edgeFactory } from './edge_factory';

export class Graph {
  constructor() {
    this.json = null;
    this.verticesById = {};
    this.edgesById = {};
    this.edgesByFrom = {};
    this.edgesByTo = {};
  }

  getVertexById(id) {
    return this.verticesById[id];
  }

  getVertices() {
    // We need a stable order for webcola
    // constraints don't work by anything other than index :(

    // Its safe to cache vertices because vertices are never added or removed from the graph. This is because
    // such changes also result in changing the hash of the pipeline, which ends up creating a new graph altogether.
    if (this.vertexCache === undefined) {
      this.vertexCache = Object.values(this.verticesById);
    }
    return this.vertexCache;
  }

  get processorVertices() {
    return this.getVertices().filter(v => v.isProcessor);
  }

  get colaVertices() {
    return this.getVertices().map(v => v.cola);
  }

  get edges() {
    return Object.values(this.edgesById);
  }

  get colaEdges() {
    return this.edges.map(e => e.cola);
  }

  update(jsonRepresentation) {
    this.json = jsonRepresentation;

    jsonRepresentation.vertices.forEach(vJson => {
      const existingVertex = this.verticesById[vJson.id];
      if (existingVertex !== undefined) {
        existingVertex.update(vJson);
      } else {
        const newVertex = vertexFactory(this, vJson);
        this.verticesById[vJson.id] = newVertex;
      }
    });

    jsonRepresentation.edges.forEach(eJson => {
      const existingEdge = this.edgesById[eJson.id];
      if (existingEdge !== undefined) {
        existingEdge.update(eJson);
      } else {
        const newEdge = edgeFactory(this, eJson);
        this.edgesById[eJson.id] = newEdge;
        if (this.edgesByFrom[newEdge.from.id] === undefined) {
          this.edgesByFrom[newEdge.from.id] = [];
        }
        this.edgesByFrom[newEdge.from.id].push(newEdge);

        if (this.edgesByTo[newEdge.to.id] === undefined) {
          this.edgesByTo[newEdge.to.id] = [];
        }
        this.edgesByTo[newEdge.to.id].push(newEdge);
      }
    });

    this.vertexRanks = this._bfs().distances;
    this.reverseVertexRanks = this._reverseBfs().distances;
    this.getSeparatedRanks();
  }

  get roots() {
    return this.getVertices().filter((v) => v.isRoot);
  }

  get leaves() {
    return this.getVertices().filter((v) => v.isLeaf);
  }

  get maxRank() {
    return Math.max.apply(null, this.getVertices().map(v => v.rank));
  }

  _getReverseVerticesByRank() {
    return this.getVertices().reduce((acc,v) => {
      const rank = v.reverseRank;
      if (acc.get(rank) === undefined) {
        acc.set(rank, []);
      }
      acc.get(rank).push(v);
      return acc;
    }, new Map());
  }

  _bfs() {
    return this._bfsTraversalUsing(this.roots, 'outgoing');
  }

  _reverseBfs() {
    return this._bfsTraversalUsing(this.leaves, 'incoming');
  }

  /**
   * Performs a breadth-first or reverse-breadth-first search
   * @param {array} startingVertices Where to start the search - either this.roots (for breadth-first) or this.leaves (for reverse-breadth-first)
   * @param {string} vertexType Either 'outgoing' (for breadth-first) or 'incoming' (for reverse-breadth-first)
   */
  _bfsTraversalUsing(startingVertices, vertexType) {
    const distances = {};
    const parents = {};
    const queue = [];
    const vertexTypePropertyName = `${vertexType}Vertices`;

    startingVertices.forEach((v) => {
      distances[v.id] = 0;
      queue.push(v);
    });
    while (queue.length > 0) {
      const currentVertex = queue.shift();
      const currentDistance = distances[currentVertex.id];

      currentVertex[vertexTypePropertyName].forEach((vertex) => {
        if (distances[vertex.id] === undefined) {
          distances[vertex.id] = currentDistance + 1;
          parents[vertex.id] = currentVertex;
          queue.push(vertex);
        }
      });
    }

    return { distances, parents };
  }

  getSeparatedRanks() {
    const bySeparatedRanks = new Map();

    let rankOffset = 0;

    const setVertexSepRank = (rank, offset) => (vertex) => vertex.sepRank = rank + offset;
    for (let rank = 0; rank < this.maxRank; rank++) {
      const vertices = this._getReverseVerticesByRank().get(rank);

      const preservedRankVertices = [];
      const offsetRankVertices = [];

      const hasPluginVertex = vertices.find(v => (v instanceof PluginVertex));
      if (vertices.length === 1 || (vertices.length === 2 && hasPluginVertex)) {
        preservedRankVertices.push(...vertices);
      } else {
        vertices.forEach(v => {
          const connectsToSibling = v.outgoingVertices.filter(ov => vertices.includes(ov)).length > 0;

          if (connectsToSibling || (v instanceof QueueVertex)) {
            offsetRankVertices.push(v);
          } else {
            preservedRankVertices.push(v);
          }
        });
      }

      bySeparatedRanks.set(rank + rankOffset, preservedRankVertices);
      preservedRankVertices.forEach(setVertexSepRank(rank, rankOffset));

      if (offsetRankVertices.length > 0) {
        rankOffset++;
        bySeparatedRanks.set(rank + rankOffset, offsetRankVertices);
        offsetRankVertices.forEach(setVertexSepRank(rank, rankOffset));
      }
    }

    const sepRankSorted = this.getVertices();
    sepRankSorted.sort((a,b) => {
      if (a.sepRank === b.sepRank) {
        return 0;
      }

      return (a.sepRank > b.sepRank) ? 1 : -1;
    });
    sepRankSorted.forEach(v => {
      if (v.incomingVertices.length === 0) {
        return;
      }

      const lowestIncomingSepRank = Math.min.apply(null, v.incomingVertices.map(vv => vv.sepRank));
      const sepRankDiff = lowestIncomingSepRank - v.sepRank;
      if (sepRankDiff > 1) {
        const newRank = v.sepRank + sepRankDiff - 1;
        const curRankRow = bySeparatedRanks.get(v.sepRank);

        if (curRankRow.length < 2) {
          return;
        }

        curRankRow.splice(curRankRow.indexOf(v), 1);
        bySeparatedRanks.get(newRank).push(v);
        v.sepRank = newRank;

      }
    });

    return bySeparatedRanks;
  }
}
