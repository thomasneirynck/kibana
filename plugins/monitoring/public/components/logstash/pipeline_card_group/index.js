import React from 'react';
import { PipelineCard } from './pipeline_card';
import { KuiEmptyTablePrompt } from 'ui_framework/components';
import { DEFAULT_NO_DATA_MESSAGE } from '../../../../common/constants';

export function PipelineCardGroup({ pipelines, onHashClick, upgradeMessage }) {

  if (!Array.isArray(pipelines) || (pipelines.length === 0)) {
    const message = upgradeMessage ? upgradeMessage : DEFAULT_NO_DATA_MESSAGE;
    return (
      <KuiEmptyTablePrompt message={ message } />
    );
  }

  const pipelineCards = pipelines.map(pipeline => (
    <PipelineCard
      key={ pipeline.id }
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
