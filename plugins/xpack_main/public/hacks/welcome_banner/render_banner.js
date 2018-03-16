import React from 'react';

import { banners } from 'ui/notify';

import { clickBanner } from './click_banner';
import { OptInBanner } from './opt_in_banner_component';

/**
 * Render the Telemetry Opt-in banner.
 *
 * @param {Object} config The advanced settings config.
 * @param {Function} fetchTelemetry Function to pull telemetry on demand.
 * @param {Object} _banners Banners singleton, which can be overridden for tests.
 */
export function renderBanner(config, fetchTelemetry, { _banners = banners } = { }) {
  const bannerId = _banners.add({
    component: (
      <OptInBanner
        optInClick={optIn => clickBanner(bannerId, config, optIn)}
        fetchTelemetry={fetchTelemetry}
      />
    ),
    priority: 10000
  });
}
