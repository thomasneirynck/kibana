import { Statement } from './statement';

export class PluginStatement extends Statement {
  constructor(id, hasExplicitId, stats, meta, pluginType, name) {
    super(id, hasExplicitId, stats, meta);
    this.pluginType = pluginType; // input, filter, or output
    this.name = name; // twitter, grok, elasticsearch, etc.
  }

  static fromPipelineGraphVertex(pluginVertex) {
    return new PluginStatement(
      pluginVertex.id,
      pluginVertex.hasExplicitId,
      pluginVertex.stats,
      pluginVertex.meta,
      pluginVertex.pluginType,
      pluginVertex.name
    );
  }
}
