import React from 'react';
import { ColaGraph } from './views/cola_graph';

export function PipelineViewer(props) {
  const graph = props.pipelineState.config.graph;

  return (
    <div className="lspvContainer">
      <ColaGraph graph={ graph }></ColaGraph>
    </div>
  );
}
