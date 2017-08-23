import _ from 'lodash';
import PropTypes from 'prop-types';
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
    <div id="upgradePlugin">
      <UpgradeSectionNavigation
        currentViewLocation={currentView.location}
        views={views}
      />
      <CurrentViewComponent
        navigateTo={navigateTo}
        registerRouteChangeListener={registerRouteChangeListener}
        setViewState={setViewState}
        views={views}
        viewState={viewState}
      />
    </div>
  );
}

UpgradeSection.propTypes = {
  currentViewLocation: PropTypes.string,
  defaultViewId: PropTypes.string,
  navigateTo: PropTypes.func,
  registerRouteChangeListener: PropTypes.func,
  setViewState: PropTypes.func,
  views: PropTypes.object,
  viewState: PropTypes.object,
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
