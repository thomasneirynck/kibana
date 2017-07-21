import _ from 'lodash';
import React from 'react';

import { UpgradeSectionNav } from '../nav';
import { DEFAULT_VIEW_ID } from '../../lib/constants';


export function UpgradeSection({
  currentViewLocation,
  navigateTo,
  registerRouteChangeListener,
  setViewState,
  views,
  viewState,
}) {
  const CurrentViewComponent = getCurrentViewComponent(views, currentViewLocation);

  return (
    <div id='upgradePlugin'>
      <UpgradeSectionNav
        currentViewLocation={ currentViewLocation }
        views={ views }
      />
      <CurrentViewComponent
        navigateTo={ navigateTo }
        registerRouteChangeListener={ registerRouteChangeListener }
        setViewState={ setViewState }
        views={ views }
        viewState={ viewState }
      />
    </div>
  );
};

UpgradeSection.propTypes = {
  currentViewLocation: React.PropTypes.string,
  navigateTo: React.PropTypes.func,
  registerRouteChangeListener: React.PropTypes.func,
  setViewState: React.PropTypes.func,
  views: React.PropTypes.object,
  viewState: React.PropTypes.object,
};

UpgradeSection.defaultProps = {
  currentViewLocation: 'home',
  navigateTo: () => {},
  registerRouteChangeListener: () => {},
  setViewState: () => {},
  views: {},
  viewState: {},
};

function getCurrentViewComponent(views, location) {
  const currentView = _.find(views, { location }) || views[DEFAULT_VIEW_ID];
  return currentView.component;
}
