import React from 'react';

export function ReindexInfo({ className }) {
  return (
    <div className={ className }>
      <p className="kuiText kuiVerticalRhythm">
        Automatically reindex and upgrade indices here so that they will continue to work when you upgrade to Elasticsearch 6.
      </p>
      <ul className="kuiText kuiVerticalRhythm">
        <li><strong>Reindex:</strong> Indices created before version 5.0 need to be reindexed.</li>
        <li><strong>Upgrade:</strong> X-Pack internal indices need to be upgraded to a new index format.</li>
        <li>All Kibana indices need to be reindexed.
          You can reindex each one by running this tool in each instance
          of Kibana. You cannot reindex all Kibana indices from this instance.
        </li>
      </ul>
      <div className="kuiVerticalRhythm kuiInfoPanel kuiInfoPanel--error">
        <div className="kuiInfoPanelHeader">
          <span className="kuiInfoPanelHeader__icon kuiIcon kuiIcon--error fa-exclamation" />
          <span className="kuiInfoPanelHeader__title">
            Backup your indices now!
          </span>
        </div>

        <div className="kuiInfoPanelBody">
          <div className="kuiInfoPanelBody__message">
            Before going further, backup your data using the <a href='https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-snapshots.html' target='_blank'>snapshot/restore api</a>.
          </div>
        </div>
      </div>
      <div className="kuiInfoPanel kuiInfoPanel--info kuiVerticalRhythm">
        <div className="kuiInfoPanelHeader">
          <span className="kuiInfoPanelHeader__icon kuiIcon kuiIcon--info fa-info" />
          <span className="kuiInfoPanelHeader__title">
            How reindexing works:
          </span>
        </div>
        <div className="kuiInfoPanelBody">
          <ul className="kuiInfoPanelBody__message">
            <li>
              Internal indices such as Kibana, Security, and Watcher will be renamed
              to <code>{'{'}name{'}'}-6</code>, e.g. <code>.kibana-6</code>
            </li>
            <li>
              Other indices will be reindexed to a new index called <code>{'{'}name{'}'}-reindexed-v5</code>,
              e.g. <code>my_index-reindexed-v5</code>.
            </li>
            <li>
              The alias <code>{'{'}name{'}'}</code> will be added to the new index, along with any
              other aliases that previously pointed to the old index.
            </li>
            <li>
              The old index will be made <strong>read-only</strong> during the reindexing process,
              after which it will be <strong>deleted</strong>.
            </li>
            <li>
              This tool will only work on <strong>open</strong> indices with status green.
              The reindex process waits for the new index to turn green before completing.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

