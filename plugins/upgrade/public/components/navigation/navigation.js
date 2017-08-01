import React from 'react';

import {
  KuiLocalNav,
  KuiLocalNavRow,
  KuiLocalNavRowSection,
  KuiLocalTab,
  KuiLocalTabs,
} from 'ui_framework/components';

const VIEW_IDS = [
  'HOME',
  'CHECKUP',
  'REINDEX',
  'LOGGING',
];

export function UpgradeSectionNavigation({ currentViewLocation, views }) {
  return (
    <KuiLocalNav>
      <KuiLocalNavRow>
        <KuiLocalNavRowSection>
          <div className="kuiLocalBreadcrumbs">
            <div className="kuiLocalBreadcrumb">
              <a className="kuiLocalBreadcrumb__link" href="#/management">
                Management
              </a>
            </div>
            <h1 id="kui_local_breadcrumb" className="kuiLocalBreadcrumb">
              Upgrade Assistant
            </h1>
          </div>
        </KuiLocalNavRowSection>
      </KuiLocalNavRow>
      <KuiLocalNavRow isSecondary>
        <KuiLocalTabs>
          { VIEW_IDS.map((viewId) => (
            <KuiLocalTab
              href={ views[viewId].absoluteLocation }
              isSelected={ currentViewLocation === views[viewId].location }
              key={ viewId }
            >
              { views[viewId].label }
            </KuiLocalTab>
          ))}
        </KuiLocalTabs>
      </KuiLocalNavRow>
    </KuiLocalNav>
  );
}

UpgradeSectionNavigation.propTypes = {
  currentViewLocation: React.PropTypes.string,
  views: React.PropTypes.object,
};

UpgradeSectionNavigation.defaultProps = {
  currentViewLocation: '',
  views: {},
};
