import { Statement } from './statement';

export class Queue extends Statement {
  static fromPipelineGraphVertex(queueVertex) {
    return new Queue(
      queueVertex.id,
      queueVertex.hasExplicitId,
      queueVertex.stats,
      queueVertex.meta
    );
  }
}
