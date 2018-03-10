import { PluginStatement } from './plugin_statement';
import { IfStatement } from './if_statement';
import { Queue } from './queue';

export function makeStatement(pipelineGraphVertex, pipelineStage) {
  const klass = pipelineGraphVertex.constructor.name;
  switch (klass) {
    case 'PluginVertex':
      return PluginStatement.fromPipelineGraphVertex(pipelineGraphVertex, pipelineStage);
    case 'IfVertex':
      return IfStatement.fromPipelineGraphVertex(pipelineGraphVertex, pipelineStage);
    case 'QueueVertex':
      return Queue.fromPipelineGraphVertex(pipelineGraphVertex, pipelineStage);
    default:
      throw new Error(`Unknown vertex class: ${klass}`);
  }
}
