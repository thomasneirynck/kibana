/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import React from 'react';
import PropTypes from 'prop-types';

export const RecognizedResult = ({
  config,
  indexPattern,
}) => {
  const href = `#/jobs/new_job/simple/recognize?id=${config.id}&index=${indexPattern.id}`;
  let logo = null;
  // if a logo is available, use that, otherwise display the id
  // the logo should be a base64 encoded image
  if (config.logo && config.logo.src) {
    logo = <div><img className="synopsisIcon" src={config.logo.src}/></div>;
  } else {
    logo = <h3 className="euiTitle euiTitle--small">{config.id}</h3>;
  }

  return (
    <div className="euiFlexItem">
      <a href={href} className="euiLink synopsis">
        <div className="euiPanel euiPanel--paddingMedium synopsisPanel">
          <div className="euiFlexGroup euiFlexGroup--gutterLarge euiFlexGroup--responsive">
            <div className="euiFlexItem euiFlexItem--flexGrowZero ml-data-recognizer-logo">
              {logo}
            </div>
            <div className="euiFlexItem synopsisContent">
              <h4 className="euiTitle euiTitle--small synopsisTitle">{config.title}</h4>
              <div className="euiText synopsisBody">
                <p>
                  <span className="euiTextColor euiTextColor--subdued">
                    {config.description}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

RecognizedResult.propTypes = {
  config: PropTypes.object,
  indexPattern: PropTypes.object,
};
