import PropTypes from 'prop-types';
import React from 'react';

import { InfoGroup } from '../info_group';
import { withViewState } from '../../lib/util/view_state';


export const HomeView = withViewState({
  initialState: {
    isInfoCollapsed: false,
  },
  updaters: {
    toggleInfoCollapsed: (state) => () => ({
      isInfoCollapsed: !state.isInfoCollapsed,
    }),
  },
})(function HomeView({ isInfoCollapsed, toggleInfoCollapsed, views }) {
  return (
    <div className="kuiView">
      <div className="kuiViewContent kuiViewContent--constrainedWidth">
        <div className="kuiViewContentItem">
          <InfoGroup
            className="kuiVerticalRhythm"
            isCollapsed={isInfoCollapsed}
            onChangeCollapsed={toggleInfoCollapsed}
            title="Overview"
          >
            <p className="kuiText kuiVerticalRhythm">
              This assistant helps you prepare for your upgrade
              from <strong>Elasticsearch 5.x</strong> to <strong>Elasticsearch 6</strong>.
            </p>
            <div className="kuiVerticalRhythm kuiInfoPanel kuiInfoPanel--warning">
              <div className="kuiInfoPanelHeader">
                <span className="kuiInfoPanelHeader__icon kuiIcon kuiIcon--warning fa-bolt" />
                <span className="kuiInfoPanelHeader__title">
                  Backup your indices now!
                </span>
              </div>

              <div className="kuiInfoPanelBody">
                <div className="kuiInfoPanelBody__message">
                  Before starting your upgrade and before using these tools, backup your data using the <a className="kuiLink" href="https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-snapshots.html" target="_blank">snapshot/restore api</a>.
                </div>
              </div>
            </div>
            <p className="kuiText kuiVerticalRhythm">
              Read more about important changes in the <a className="kuiLink" href="https://www.elastic.co/guide/en/elasticsearch/reference/6.0/breaking-changes-6.0.html">Breaking Changes</a> documentation online.
            </p>
          </InfoGroup>

          <div className="kuiVerticalRhythm">
            <h3 className="kuiTextTitle kuiVerticalRhythmSmall">
              Cluster Checkup
            </h3>
            <p className="kuiText kuiVerticalRhythmSmall">
              Run a series of checks on your cluster, nodes, and indices and
              find out about any known problems that need to be addressed
              before upgrading.
            </p>
            <p className="kuiText kuiVerticalRhythmSmall">
              <a className="kuiLink" href={views.CHECKUP.absoluteLocation}>
                Go to Cluster Checkup.
              </a>
            </p>
          </div>

          <div className="kuiVerticalRhythm">
            <h3 className="kuiTextTitle kuiVerticalRhythmSmall">
              Reindex Helper
            </h3>
            <p className="kuiText kuiVerticalRhythmSmall">
              Indices created before version 5.0 need to be reindexed before
              they can be used in Elasticsearch 6. Indices created after 5.0
              may need to be upgraded with new settings. Run the reindex helper to
              automatically reindex and upgrade indices.
            </p>
            <p className="kuiText kuiVerticalRhythmSmall">
              <a className="kuiLink" href={views.REINDEX.absoluteLocation}>
                Go to Reindex Helper.
              </a>
            </p>
          </div>

          <div className="kuiVerticalRhythm">
            <h3 className="kuiTextTitle kuiVerticalRhythmSmall">
              Toggle Deprecation Logging
            </h3>
            <p className="kuiText kuiVerticalRhythmSmall">
              Elasticsearch comes with a deprecation logger which will log a
              message whenever deprecated functionality is used.
              Enable or disable deprecation logging on your cluster here.
              This is enabled by default, beginning in Elasticsearch 5.
            </p>
            <p className="kuiText kuiVerticalRhythmSmall">
              <a className="kuiLink" href={views.LOGGING.absoluteLocation}>
                Go to Toggle Deprecation Logging.
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

HomeView.propTypes = {
  views: PropTypes.shape({
    CHECKUP: PropTypes.object.isRequired,
    REINDEX: PropTypes.object.isRequired,
    LOGGING: PropTypes.object.isRequired,
  }),
};

HomeView.defaultProps = {
  views: {
    CHECKUP: {},
    REINDEX: {},
    LOGGING: {},
  },
};

