import _ from 'lodash';
import React from 'react';

import { UpgradeSectionNavigation } from '../navigation';


export function UpgradeSection({
  currentViewLocation,
  defaultViewId,
  navigateTo,
  registerRouteChangeListener,
  setViewState,
  views,
  viewState,
}) {
  const currentView = getCurrentView(views, currentViewLocation, defaultViewId);
  const CurrentViewComponent = currentView.component;

  return (
    <div id='upgradePlugin'>
      <UpgradeSectionNavigation
        currentViewLocation={ currentView.location }
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
  defaultViewId: React.PropTypes.string,
  navigateTo: React.PropTypes.func,
  registerRouteChangeListener: React.PropTypes.func,
  setViewState: React.PropTypes.func,
  views: React.PropTypes.object,
  viewState: React.PropTypes.object,
};

UpgradeSection.defaultProps = {
  currentViewLocation: 'home',
  defaultViewId: '',
  navigateTo: () => {},
  registerRouteChangeListener: () => {},
  setViewState: () => {},
  views: {},
  viewState: {},
};

function getCurrentView(views, location, defaultViewId) {
  return _.find(views, { location }) || views[defaultViewId];
}
