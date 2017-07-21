import React from 'react';
import {
  KuiMenu,
  KuiMenuItem,
  KuiEvent,
  KuiEventBody,
  KuiEventBodyMessage,
  KuiEventBodyMetadata,
  KuiKeyboardAccessible
} from 'ui_framework/components';
import { formatDateTimeLocal, shortenPipelineHash } from 'monitoring-formatting';
import { CALCULATE_DURATION_SINCE } from 'monitoring-constants';
import { formatTimestampToDuration } from 'plugins/monitoring/lib/format_number';

function renderHashesInfo(pipeline) {
  const numHashes = pipeline.hashes.length;
  if (numHashes <= 1) {
    return null;
  }

  const hashesStr = numHashes === 1
    ? `has been 1 version`
    : `have been ${numHashes} versions`;

  return (
    <span className="kuiSubText">In the selected time range there { hashesStr } of the "{ pipeline.id }" pipeline</span>
  );
}

export function PipelineCard({ pipeline, onHashClick }) {
  const id = pipeline.id;
  const menuItems = pipeline.hashes.map(hashObj => {
    const hash = hashObj.hash;
    const hashShort = shortenPipelineHash(hash);
    const onClick = () => onHashClick(id, hash);
    const lastSeen = hashObj.lastSeen;
    const relativeLastSeen = formatTimestampToDuration(lastSeen, CALCULATE_DURATION_SINCE);

    return (
      <KuiMenuItem key={ hash }>
        <KuiEvent>
          <KuiEventBody>
            <KuiEventBodyMessage>
              <KuiKeyboardAccessible>
                <a
                  className="kuiLink"
                  onClick={ onClick }
                  title={ hash }>Version { hashShort }</a>
              </KuiKeyboardAccessible>
            </KuiEventBodyMessage>
            <KuiEventBodyMetadata>
              Last seen <span title={ formatDateTimeLocal(lastSeen) }>{ relativeLastSeen } ago</span>
            </KuiEventBodyMetadata>
          </KuiEventBody>
        </KuiEvent>
      </KuiMenuItem>
    );
  });

  return (
    <div className="monitoringLogstashPipelineCardGroup__card">
      <div className="kuiPanel monitoringLogstashPipelineCardGroup__cardPanel">
        <div className="kuiPanelHeader">
          <div className="kuiPanelHeaderSection">
            <div className="kuiPanelHeader__title">
              { id }
            </div>
          </div>
        </div>
        <div className="kuiPanelBody">
          { renderHashesInfo(pipeline) }
          <KuiMenu className="monitoringLogstashPipelineCardGroup__cardMenu">
            { menuItems }
          </KuiMenu>
        </div>
      </div>
    </div>
  );
}