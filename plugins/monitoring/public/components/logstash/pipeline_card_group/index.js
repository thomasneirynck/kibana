import React from 'react';
import { PipelineCard } from './pipeline_card';

export function PipelineCardGroup({ pipelines, onHashClick }) {

  const pipelineCards = pipelines.map(pipeline => (
    <PipelineCard
      key={ pipeline.name }
      pipeline={ pipeline }
      onHashClick={ onHashClick }
    />
  ));

  return (
    <div className="monitoringLogstashPipelineCardGroup">
      { pipelineCards }
    </div>
  );
}
